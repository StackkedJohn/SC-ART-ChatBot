-- Enable pgvector extension
create extension if not exists vector;

-- Categories (top level organization)
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  sort_order int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Subcategories (nested under categories)
create table subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text,
  sort_order int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Content items (the actual knowledge base content)
create table content_items (
  id uuid primary key default gen_random_uuid(),
  subcategory_id uuid not null references subcategories(id) on delete cascade,
  title text not null,
  content text not null,
  is_active boolean default true,
  last_embedded_at timestamp with time zone,
  sort_order int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Document chunks for RAG (vector search)
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  chunk_text text not null,
  chunk_index int not null,
  embedding vector(1536),
  metadata jsonb default '{}',
  created_at timestamp with time zone default now()
);

-- Create index for vector similarity search
create index on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Uploaded documents (before processing)
create table uploaded_documents (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  file_type text not null,
  file_url text,
  status text default 'pending',
  target_subcategory_id uuid references subcategories(id),
  error_message text,
  created_at timestamp with time zone default now(),
  processed_at timestamp with time zone
);

-- Quizzes
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subcategory_id uuid references subcategories(id),
  time_limit_minutes int,
  passing_score int default 70,
  is_published boolean default false,
  total_attempts int default 0,
  average_score decimal(5,2),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Quiz questions
create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('multiple_choice', 'true_false', 'short_answer')),
  correct_answer text not null,
  options jsonb,
  explanation text,
  points int default 1,
  sort_order int default 0,
  created_at timestamp with time zone default now()
);

-- Quiz attempts (track who took what)
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  user_name text not null,
  user_email text,
  score int not null,
  total_points int not null,
  percentage int not null,
  passed boolean not null,
  answers jsonb not null,
  time_taken_seconds int,
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone default now()
);

-- Chat sessions (for analytics, optional)
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  messages jsonb default '[]',
  user_identifier text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to relevant tables
create trigger update_categories_updated_at
  before update on categories
  for each row execute function update_updated_at();

create trigger update_subcategories_updated_at
  before update on subcategories
  for each row execute function update_updated_at();

create trigger update_content_items_updated_at
  before update on content_items
  for each row execute function update_updated_at();

create trigger update_quizzes_updated_at
  before update on quizzes
  for each row execute function update_updated_at();

create trigger update_chat_sessions_updated_at
  before update on chat_sessions
  for each row execute function update_updated_at();

-- Add indexes for performance
create index idx_subcategories_category on subcategories(category_id);
create index idx_content_items_subcategory on content_items(subcategory_id);
create index idx_document_chunks_content_item on document_chunks(content_item_id);
create index idx_quiz_questions_quiz on quiz_questions(quiz_id);
create index idx_quiz_attempts_quiz on quiz_attempts(quiz_id);
