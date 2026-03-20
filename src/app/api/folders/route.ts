import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createFolderSchema } from "@/lib/validations/folder";
import type { Folder } from "@/types";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", user.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const folders = (data ?? []) as Folder[];

  // Fetch link counts per folder in one query
  const { data: countData } = await supabase
    .from("links")
    .select("folder_id")
    .eq("user_id", user.id)
    .eq("status", "unread")
    .not("folder_id", "is", null);

  const countMap: Record<string, number> = {};
  for (const row of (countData ?? []) as Array<{ folder_id: string }>) {
    countMap[row.folder_id] = (countMap[row.folder_id] ?? 0) + 1;
  }

  const result = folders.map((f) => ({ ...f, link_count: countMap[f.id] ?? 0 }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = createFolderSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, color } = result.data;

  const { data: existing } = await supabase
    .from("folders")
    .select("position")
    .eq("user_id", user.id)
    .order("position", { ascending: false })
    .limit(1);

  const rows = (existing ?? []) as Array<{ position: number }>;
  const position = rows.length > 0 ? rows[0].position + 1 : 0;

  const { data, error } = await supabase
    .from("folders")
    .insert({ user_id: user.id, name, color, position })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as Folder, { status: 201 });
}
