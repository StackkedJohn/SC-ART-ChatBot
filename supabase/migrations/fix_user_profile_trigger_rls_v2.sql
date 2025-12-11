-- Fix RLS policy to allow trigger-based user profile creation (v2)
-- The issue: RLS policies apply even to SECURITY DEFINER functions
-- The solution: Modify the trigger function to explicitly bypass RLS

-- First, revert the previous policy change and restore original
drop policy if exists "Allow user profile creation" on user_profiles;

create policy "Admins can insert user profiles"
  on user_profiles for insert
  with check (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Now fix the trigger function to bypass RLS for the insert
create or replace function handle_new_user()
returns trigger as $$
begin
  -- Set local session to bypass RLS for this function execution
  -- This is safe because SECURITY DEFINER ensures controlled execution
  perform set_config('session_replication_role', 'replica', true);

  insert into public.user_profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'intern')
  );

  -- Reset session replication role
  perform set_config('session_replication_role', 'origin', true);

  return new;
exception
  when others then
    -- Always reset session replication role on error
    perform set_config('session_replication_role', 'origin', true);
    raise;
end;
$$ language plpgsql security definer;
