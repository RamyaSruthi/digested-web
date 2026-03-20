import { createAdminClient } from "@/lib/supabase/admin";
import { getUserFromExtensionToken } from "@/lib/extension-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { detectContentType } from "@/lib/detect-content-type";
import type { Link } from "@/types";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

const saveSchema = z.object({
  url: z.string().url("Invalid URL"),
  title: z.string().max(255).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  folder_id: z.string().uuid().optional().nullable(),
});

export async function POST(request: Request) {
  const userId = await getUserFromExtensionToken(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS_HEADERS });
  }

  const result = saveSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { url, title, description, image_url, folder_id } = result.data;
  const content_type = detectContentType(url);

  const admin = createAdminClient();

  // Check for duplicate URL for this user
  const { data: existing } = await admin
    .from("links")
    .select("id")
    .eq("user_id", userId)
    .eq("url", url)
    .maybeSingle() as { data: { id: string } | null; error: unknown };

  if (existing) {
    return NextResponse.json(
      { error: "already_saved", id: existing.id },
      { status: 409, headers: CORS_HEADERS }
    );
  }

  const { data, error } = await admin
    .from("links")
    .insert({
      user_id: userId,
      url,
      title: title ?? null,
      description: description ?? null,
      image_url: image_url ?? null,
      folder_id: folder_id ?? null,
      status: "unread",
      content_type,
      scroll_progress: 0,
      position: 0,
    })
    .select()
    .single() as { data: Link | null; error: { message: string } | null };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json(data, { status: 201, headers: CORS_HEADERS });
}
