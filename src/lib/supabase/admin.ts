import { createClient } from "@supabase/supabase-js";

// Service-role client — only for server-side extension API routes.
// Not typed with Database generic because our custom type lacks Supabase's
// internal PostgrestVersion shape; cast results at call sites instead.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
