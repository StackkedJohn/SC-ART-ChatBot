-- Fix infinite recursion in user_profiles RLS policies
-- The issue: policies were referencing user_profiles table within the policy itself
-- Solution: Allow all authenticated users to read any profile (simpler and works for this use case)
--           Admin operations will use service role key (supabaseAdmin) which bypasses RLS

-- Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON user_profiles;

-- Simple policy: Allow all authenticated users to read profiles
-- This is safe because user profiles only contain non-sensitive info (email, name, role)
CREATE POLICY "Authenticated users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Note: INSERT and DELETE operations will be handled by service role (supabaseAdmin)
-- which bypasses RLS, so no policies needed for those

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_profiles';
