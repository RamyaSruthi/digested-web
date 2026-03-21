import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ connected: false, username: null });
  }

  const { data } = await supabase
    .from("integrations")
    .select("provider_username")
    .eq("user_id", user.id)
    .eq("provider", "instagram")
    .single();

  return NextResponse.json({
    connected: !!data,
    username: data?.provider_username ?? null,
  });
}
