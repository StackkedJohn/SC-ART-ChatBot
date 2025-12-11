-- Add has_seen_welcome column to user_profiles table
-- This tracks whether an intern has seen the welcome modal

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS has_seen_welcome BOOLEAN DEFAULT FALSE;

-- Update existing users to have seen welcome (so only new users get it)
UPDATE user_profiles
SET has_seen_welcome = TRUE
WHERE has_seen_welcome IS NULL;
