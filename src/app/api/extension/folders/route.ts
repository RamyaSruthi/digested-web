import { createAdminClient } from "@/lib/supabase/admin";
import { getUserFromExtensionToken } from "@/lib/extension-auth";
import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const userId = await getUserFromExtensionToken(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("folders")
    .select("id, name, color")
    .eq("user_id", userId)
    .order("position", { ascending: true }) as {
      data: { id: string; name: string; color: string }[] | null;
      error: { message: string } | null;
    };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json(data ?? [], { headers: CORS_HEADERS });
}
