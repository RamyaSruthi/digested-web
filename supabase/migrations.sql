-- ============================================================
-- Digested — incremental migrations (run after schema.sql)
-- Run each block in Supabase SQL Editor in order.
-- ============================================================

-- [1] Reading progress — scroll position per link
ALTER TABLE links
  ADD COLUMN IF NOT EXISTS scroll_progress integer NOT NULL DEFAULT 0;

-- [2] Browser extension — API token per user
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS extension_token text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_extension_token
  ON profiles (extension_token)
  WHERE extension_token IS NOT NULL;
