-- Add authentication and role-based access control

-- Create user role enum
create type user_role as enum ('admin', 'artist', 'intern');

-- User profiles table (extends Supabase auth.users)
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role user_role not null default 'intern',
  invited_by uuid references auth.users(id),
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- User invitations table (for admin-managed invitations)
create table user_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role user_role not null,
  invited_by uuid not null references auth.users(id),
  token text not null unique,
  expires_at timestamp with time zone not null,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Trigger to create user profile when auth user is created
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

-- Trigger on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Updated_at trigger for user_profiles
create trigger update_user_profiles_updated_at
  before update on user_profiles
  for each row execute function update_updated_at();

-- Add indexes
create index idx_user_profiles_role on user_profiles(role);
create index idx_user_profiles_email on user_profiles(email);
create index idx_user_invitations_email on user_invitations(email);
create index idx_user_invitations_token on user_invitations(token);

-- Enable Row Level Security (RLS)
alter table user_profiles enable row level security;
alter table user_invitations enable row level security;

-- RLS Policies for user_profiles
-- Users can read their own profile
create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = id);

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on user_profiles for select
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update user profiles
create policy "Admins can update user profiles"
  on user_profiles for update
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can insert user profiles (for invitation flow)
create policy "Admins can insert user profiles"
  on user_profiles for insert
  with check (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for user_invitations
-- Admins can view all invitations
create policy "Admins can view invitations"
  on user_invitations for select
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can create invitations
create policy "Admins can create invitations"
  on user_invitations for insert
  with check (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for existing tables (protect by role)
-- Categories - all authenticated users can read
create policy "Authenticated users can view categories"
  on categories for select
  using (auth.role() = 'authenticated');

-- Only admins can modify categories
create policy "Admins can manage categories"
  on categories for all
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Subcategories - all authenticated users can read
create policy "Authenticated users can view subcategories"
  on subcategories for select
  using (auth.role() = 'authenticated');

-- Only admins can modify subcategories
create policy "Admins can manage subcategories"
  on subcategories for all
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Content items - all authenticated users can read
create policy "Authenticated users can view content"
  on content_items for select
  using (auth.role() = 'authenticated');

-- Admins and artists can manage content
create policy "Admins and artists can manage content"
  on content_items for all
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role in ('admin', 'artist')
    )
  );

-- Document chunks - all authenticated users can read
create policy "Authenticated users can view chunks"
  on document_chunks for select
  using (auth.role() = 'authenticated');

-- Admins can manage chunks
create policy "Admins can manage chunks"
  on document_chunks for all
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Quizzes - all authenticated users can read
create policy "Authenticated users can view quizzes"
  on quizzes for select
  using (auth.role() = 'authenticated');

-- Admins can manage quizzes
create policy "Admins can manage quizzes"
  on quizzes for all
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Quiz questions - all authenticated users can read
create policy "Authenticated users can view quiz questions"
  on quiz_questions for select
  using (auth.role() = 'authenticated');

-- Admins can manage quiz questions
create policy "Admins can manage quiz questions"
  on quiz_questions for all
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Quiz attempts - users can view their own attempts, admins can view all
create policy "Users can view own quiz attempts"
  on quiz_attempts for select
  using (
    user_email = (select email from user_profiles where id = auth.uid())
    or exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- All authenticated users can create quiz attempts
create policy "Authenticated users can create quiz attempts"
  on quiz_attempts for insert
  with check (auth.role() = 'authenticated');

-- Uploaded documents - all authenticated users can read
create policy "Authenticated users can view uploaded documents"
  on uploaded_documents for select
  using (auth.role() = 'authenticated');

-- Admins can manage uploaded documents
create policy "Admins can manage uploaded documents"
  on uploaded_documents for all
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Enable RLS on all existing tables
alter table categories enable row level security;
alter table subcategories enable row level security;
alter table content_items enable row level security;
alter table document_chunks enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;
alter table uploaded_documents enable row level security;
