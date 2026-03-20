import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all unread link IDs and pick one randomly
  const { data, error } = await supabase
    .from("links")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "unread");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ link: null });

  const random = data[Math.floor(Math.random() * data.length)];
  return NextResponse.json({ link: random });
}
