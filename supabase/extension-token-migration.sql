-- Run this in Supabase SQL Editor to enable the browser extension feature

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS extension_token text UNIQUE;

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_extension_token
  ON profiles (extension_token)
  WHERE extension_token IS NOT NULL;
