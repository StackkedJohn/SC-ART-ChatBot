-- Create intern user for SC-ART ChatBot
-- Run this in Supabase SQL Editor to manually create an intern account
-- IMPORTANT: Change the email and password below!

-- Create intern user (replace email and password)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'intern@testing.test',  -- ⚠️ CHANGE THIS to the intern's email
  crypt('TestingIntern12', gen_salt('bf')),  -- ⚠️ CHANGE THIS to a strong password
  now(),
  '{"full_name": "Intern User", "role": "intern"}'::jsonb,  -- ⚠️ CHANGE full_name if desired
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Verify the user was created with intern role
SELECT
  up.email,
  up.full_name,
  up.role,
  up.is_active,
  up.created_at
FROM user_profiles up
WHERE up.email = 'intern@testing.test';  -- ⚠️ CHANGE THIS to match your intern email above

-- If the role is not 'intern', update it:
-- UPDATE user_profiles SET role = 'intern' WHERE email = 'intern@testing.test';

-- Check if user_stats was created (should happen automatically)
SELECT
  us.user_id,
  us.total_xp,
  us.current_level,
  us.level_name
FROM user_stats us
JOIN user_profiles up ON us.user_id = up.id
WHERE up.email = 'intern@testing.test';  -- ⚠️ CHANGE THIS to match your intern email above
