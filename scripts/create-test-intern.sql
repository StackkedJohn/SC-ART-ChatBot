-- Create a test intern user to verify welcome modal functionality
-- Password: TestIntern123

-- First, run the migration to add has_seen_welcome column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS has_seen_welcome BOOLEAN DEFAULT FALSE;

-- Create test intern user profile
-- Note: You'll need to create the auth user in Supabase Auth first
-- This just sets up the profile with has_seen_welcome = FALSE

INSERT INTO user_profiles (id, email, full_name, role, is_active, has_seen_welcome, created_at, updated_at)
VALUES (
  'test-intern-id', -- Replace with actual auth user ID after creating in Supabase Auth
  'intern@testing.test',
  'Test Intern',
  'intern',
  true,
  false, -- This will trigger the welcome modal on first login
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET has_seen_welcome = false; -- Reset welcome status for testing

-- Verify the user was created
SELECT id, email, full_name, role, is_active, has_seen_welcome
FROM user_profiles
WHERE email = 'intern@testing.test';
