import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resolves an extension API token from the Authorization header
 * and returns the corresponding user ID, or null if invalid.
 */
export async function getUserFromExtensionToken(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("extension_token", token)
    .single() as { data: { id: string } | null; error: unknown };

  return data?.id ?? null;
}
