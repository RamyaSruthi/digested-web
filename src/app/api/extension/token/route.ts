import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

// GET — return whether a token exists (masked)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("extension_token")
    .eq("id", user.id)
    .single() as { data: { extension_token: string | null } | null; error: unknown };

  const token = data?.extension_token ?? null;
  return NextResponse.json({
    has_token: !!token,
    token_preview: token ? `****${token.slice(-8)}` : null,
  });
}

// POST — generate a new token (replaces any existing)
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const newToken = randomBytes(32).toString("hex");

  const admin = createAdminClient();
  const { error } = await (admin
    .from("profiles")
    .update({ extension_token: newToken })
    .eq("id", user.id) as unknown as Promise<{ error: { message: string } | null }>);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ token: newToken });
}

// DELETE — revoke the token
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await (admin
    .from("profiles")
    .update({ extension_token: null })
    .eq("id", user.id) as unknown as Promise<{ error: { message: string } | null }>);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
