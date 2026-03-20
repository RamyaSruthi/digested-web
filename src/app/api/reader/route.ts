import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractContent } from "@/lib/reader";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url parameter required" }, { status: 400 });

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const content = await extractContent(url);
  if (!content) {
    return NextResponse.json({ error: "Could not extract content from this page" }, { status: 422 });
  }

  return NextResponse.json(content);
}
