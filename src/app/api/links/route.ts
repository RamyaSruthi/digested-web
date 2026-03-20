import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createLinkSchema, linkFiltersSchema } from "@/lib/validations/link";
import { detectContentType } from "@/lib/detect-content-type";
import type { Link } from "@/types";

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const filters = linkFiltersSchema.safeParse({
    status:       searchParams.get("status")       ?? undefined,
    folder_id:    searchParams.get("folder_id")    ?? undefined,
    has_notes:    searchParams.get("has_notes") === "true" ? true : undefined,
    content_type: searchParams.get("content_type") ?? undefined,
    search:       searchParams.get("search")       ?? undefined,
    tag:          searchParams.get("tag")          ?? undefined,
  });

  let query = supabase
    .from("links")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (filters.success) {
    if (filters.data.status)       query = query.eq("status", filters.data.status);
    else                           query = query.neq("status", "archived");
    if (filters.data.folder_id)    query = query.eq("folder_id", filters.data.folder_id);
    if (filters.data.content_type) query = query.eq("content_type", filters.data.content_type);
    if (filters.data.has_notes)    query = query.not("notes", "is", null).neq("notes", "");
    if (filters.data.search) {
      const s = `%${filters.data.search}%`;
      query = query.or(`title.ilike.${s},description.ilike.${s},notes.ilike.${s}`);
    }
    if (filters.data.tag) {
      // Filter by tag via subquery: only links that have this tag
      const { data: taggedIds } = await supabase
        .from("link_tags")
        .select("link_id")
        .eq("user_id", user.id)
        .eq("name", filters.data.tag);
      const ids = (taggedIds ?? []).map((t) => t.link_id);
      if (ids.length === 0) return NextResponse.json([] as Link[]);
      query = query.in("id", ids);
    }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []) as Link[]);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const result = createLinkSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const { url, title, description, image_url, folder_id } = result.data;
  const content_type = detectContentType(url, body.og_type ?? null);

  const { data, error } = await supabase
    .from("links")
    .insert({
      user_id: user.id,
      url,
      title:        title       ?? null,
      description:  description ?? null,
      image_url:    image_url   || null,
      folder_id:    folder_id   ?? null,
      status:       "unread",
      content_type,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data as Link, { status: 201 });
}
