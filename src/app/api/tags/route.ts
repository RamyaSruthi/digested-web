import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("link_tags")
    .select("name")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Count occurrences of each tag name
  const countMap: Record<string, number> = {};
  for (const { name } of data ?? []) {
    countMap[name] = (countMap[name] ?? 0) + 1;
  }

  const tags = Object.entries(countMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return NextResponse.json(tags);
}
