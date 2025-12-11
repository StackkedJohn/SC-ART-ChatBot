-- Create first admin user for SC-ART ChatBot
-- Run this in Supabase SQL Editor to create your first admin account
-- IMPORTANT: Change the email and password below!

-- Create admin user (replace email and password)
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
  'admin@testing.test',  -- ⚠️ CHANGE THIS to your admin email
  crypt('TestingAdmin12', gen_salt('bf')),  -- ⚠️ CHANGE THIS to a strong password
  now(),
  '{"full_name": "Admin User", "role": "admin"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Verify the user was created and has admin role
SELECT
  up.email,
  up.full_name,
  up.role,
  up.is_active,
  up.created_at
FROM user_profiles up
WHERE up.email = 'admin@testing.test';  -- ⚠️ CHANGE THIS to match your admin email above

-- If the role is not 'admin', update it:
-- UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@scart.com';
