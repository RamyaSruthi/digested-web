import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url).searchParams.get("url");
  if (!url) return NextResponse.json({ exists: false });

  const { data } = await supabase
    .from("links")
    .select("id, title, url, status")
    .eq("user_id", user.id)
    .eq("url", url)
    .maybeSingle();

  return NextResponse.json({ exists: !!data, link: data ?? null });
}
