-- Fix RLS policy to allow trigger-based user profile creation
-- The issue: The handle_new_user() trigger tries to insert into user_profiles,
-- but the existing RLS policy only allows inserts from authenticated admins.
-- The trigger runs with SECURITY DEFINER which should bypass RLS, but we need
-- to explicitly allow service role to bypass RLS.

-- Drop the restrictive admin-only insert policy
drop policy if exists "Admins can insert user profiles" on user_profiles;

-- Create a new policy that allows:
-- 1. Service role (bypass RLS completely - this covers trigger execution)
-- 2. Admins can still manually insert if needed
create policy "Allow user profile creation"
  on user_profiles for insert
  with check (
    -- Allow if using service role (bypass_rls is true)
    auth.jwt()->>'role' = 'service_role'
    or
    -- Or if an admin is authenticated
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );
