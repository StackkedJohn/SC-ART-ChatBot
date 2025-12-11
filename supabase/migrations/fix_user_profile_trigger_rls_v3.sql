-- Fix RLS policy to allow trigger-based user profile creation (v3)
-- The issue: session_replication_role requires superuser privileges
-- The solution: Create a policy that allows inserts during trigger execution

-- First, revert the trigger function to the original simple version
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'intern')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop the existing admin-only insert policy
drop policy if exists "Admins can insert user profiles" on user_profiles;
drop policy if exists "Allow user profile creation" on user_profiles;

-- Create a new policy that allows:
-- 1. The trigger to insert (when auth.uid() matches the ID being inserted)
-- 2. Admins can still manually insert
create policy "Allow user profile creation"
  on user_profiles for insert
  with check (
    -- Allow if the ID being inserted matches the current auth.uid()
    -- This happens during trigger execution when a new user is created
    id = auth.uid()
    or
    -- Or if an admin is authenticated and manually inserting
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );
