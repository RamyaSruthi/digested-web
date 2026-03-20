import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Highlight } from "@/types";

const createSchema = z.object({
  link_id: z.string().uuid(),
  text: z.string().min(1).max(2000),
  color: z.enum(["yellow", "green", "blue", "pink"]),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const linkId = searchParams.get("link_id");

  let query = supabase
    .from("highlights")
    .select(linkId ? "*" : "*, links(id, title, url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (linkId) query = query.eq("link_id", linkId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("highlights")
    .insert({ ...result.data, user_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data as Highlight, { status: 201 });
}
