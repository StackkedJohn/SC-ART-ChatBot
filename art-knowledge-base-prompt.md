# AI Knowledge Base Application - Claude Code Prompt

Build an AI-powered Knowledge Base application for employee onboarding and training. This is a proof of concept for the Art department of a screen printing company.

## Project Context

This application is designed to:
- Reduce onboarding time for new employees (interns to senior designers)
- Provide instant answers to department questions via AI chat
- Generate quizzes from training materials automatically
- Create a single source of truth for all Art department documentation
- Be easy to maintain by non-technical staff

The Art department will beta test this before rolling out company-wide. Success here means the system can be copied to other departments.

---

## Tech Stack

- **Framework:** Next.js 14+ with App Router
- **Database:** Supabase (PostgreSQL + pgvector for embeddings)
- **Auth:** None for MVP (simple admin access)
- **UI:** Tailwind CSS + shadcn/ui components
- **AI:** Claude API (Anthropic) for chat and quiz generation
- **Language:** TypeScript throughout

---

## Core Features

### 1. Knowledge Base Chat Interface

The main feature - employees can ask questions and get AI-powered answers.

**Requirements:**
- Clean, full-page chat interface as the landing page
- Questions answered by Claude using RAG (Retrieval Augmented Generation)
- Display source references showing which documents/sections the answer came from
- Conversation history within a session
- "New Chat" button to start fresh
- Example questions shown for first-time users

**User Flow:**
1. User lands on chat page
2. Types question like "What's the discharge rate for Heather Royal?"
3. System searches knowledge base for relevant content
4. Claude generates answer using that context
5. Response shows answer + "Sources: Discharge Printing > Heather Royal"

### 2. Quiz Generation & Taking

Admins can auto-generate quizzes from content, employees can take them.

**Requirements:**
- Admin selects content items or entire subcategories
- Click "Generate Quiz" - AI creates 5-10 questions
- Admin can preview, edit questions, then save
- Quiz types supported: multiple choice, true/false, short answer
- Users enter their name before taking quiz (no login required)
- Show score and correct answers after submission
- Store all attempts for future analytics/gamification

### 3. Admin Content Management

Simple CRUD interface for managing the knowledge base.

**Requirements:**
- Hierarchical structure: Categories → Subcategories → Content Items
- Drag-and-drop reordering (or simple sort order numbers)
- Rich text editor with markdown support for content
- Preview how content will look
- Bulk operations (delete multiple items)

**Example Content Structure:**
```
📁 Discharge Printing
   📂 Heather Royal
      📄 Best Practices
      📄 Discharge Rates
      📄 Common Issues
   📂 Tri-Blend Materials
      📄 Setup Guide
      📄 Ink Specifications

📁 Templates
   📂 Building Templates
      📄 Step-by-Step Guide
      📄 Template Standards
   📂 Template Library
      📄 Available Templates List

📁 Job Descriptions
   📂 Intern
      📄 Responsibilities
      📄 30-60-90 Day Training
   📂 Staff Artist
      📄 Responsibilities
      📄 Promotion Criteria
   📂 Junior Designer
      📄 Responsibilities
      📄 Required Skills
   📂 Senior Designer
      📄 Responsibilities
      📄 Leadership Expectations

📁 Onboarding
   📂 Pre-Onboarding
      📄 Before Your First Day
      📄 Required Reading
   📂 Week 1
      📄 Day 1 Checklist
      📄 System Access Setup
   📂 Training Modules
      📄 Module 1: Company Overview
      📄 Module 2: Art Department Basics
      📄 Module 3: Tools & Software
      📄 Module 4: Quality Standards

📁 SOPs (Standard Operating Procedures)
   📂 Art Request Forms (ARF)
      📄 How to Read an ARF
      📄 Common ARF Issues
   📂 Quality Control
      📄 CSI Prevention
      📄 Review Checklist
```

### 4. Document Upload & Ingestion

Upload existing documents to populate the knowledge base.

**Requirements:**
- Support PDF, Word (.docx), and Markdown (.md) files
- Parse documents and extract text
- Chunk documents into smaller pieces for RAG (500-1000 tokens each)
- Generate embeddings for each chunk using Claude
- Store in pgvector for semantic search
- Admin assigns uploaded docs to categories/subcategories
- Show processing status (uploading, parsing, embedding, complete)

### 5. Browse Knowledge Base

Alternative to chat - users can manually browse content.

**Requirements:**
- Grid/list view of all categories
- Click category to see subcategories
- Click subcategory to see content items
- Full content view with nice typography
- Search bar to filter content
- Breadcrumb navigation

---

## Database Schema

```sql
-- Enable pgvector extension
create extension if not exists vector;

-- Categories (top level organization)
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text, -- emoji or icon name
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
  content text not null, -- markdown content
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
  embedding vector(1536), -- OpenAI embedding size, adjust if using different model
  metadata jsonb default '{}',
  created_at timestamp with time zone default now()
);

-- Create index for vector similarity search
create index on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Uploaded documents (before processing)
create table uploaded_documents (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  file_type text not null, -- 'pdf', 'docx', 'md'
  file_url text, -- Supabase storage URL
  status text default 'pending', -- 'pending', 'processing', 'completed', 'failed'
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
  subcategory_id uuid references subcategories(id), -- optional association
  time_limit_minutes int, -- optional time limit
  passing_score int default 70, -- percentage to pass
  is_published boolean default false,
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
  options jsonb, -- for multiple choice: ["Option A", "Option B", "Option C", "Option D"]
  explanation text, -- shown after answering
  points int default 1,
  sort_order int default 0,
  created_at timestamp with time zone default now()
);

-- Quiz attempts (track who took what)
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  user_name text not null, -- simple name entry, no auth
  user_email text, -- optional
  score int not null,
  total_points int not null,
  percentage int not null,
  passed boolean not null,
  answers jsonb not null, -- { questionId: userAnswer }
  time_taken_seconds int,
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone default now()
);

-- Chat sessions (for analytics, optional)
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  messages jsonb default '[]', -- array of {role, content, sources}
  user_identifier text, -- optional, could be IP or entered name
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
create trigger update_categories_updated_at before update on categories for each row execute function update_updated_at();
create trigger update_subcategories_updated_at before update on subcategories for each row execute function update_updated_at();
create trigger update_content_items_updated_at before update on content_items for each row execute function update_updated_at();
create trigger update_quizzes_updated_at before update on quizzes for each row execute function update_updated_at();
create trigger update_chat_sessions_updated_at before update on chat_sessions for each row execute function update_updated_at();
```

---

## Page Structure

```
app/
├── page.tsx                          # Main chat interface (home)
├── browse/
│   ├── page.tsx                      # Browse all categories
│   ├── [categoryId]/
│   │   ├── page.tsx                  # View category & subcategories
│   │   └── [subcategoryId]/
│   │       └── page.tsx              # View content items
├── content/
│   └── [contentId]/
│       └── page.tsx                  # View single content item
├── quizzes/
│   ├── page.tsx                      # List available quizzes
│   └── [quizId]/
│       ├── page.tsx                  # Quiz intro/start page
│       ├── take/
│       │   └── page.tsx              # Take the quiz
│       └── results/
│           └── [attemptId]/
│               └── page.tsx          # View quiz results
├── admin/
│   ├── page.tsx                      # Admin dashboard
│   ├── categories/
│   │   ├── page.tsx                  # List/manage categories
│   │   ├── new/
│   │   │   └── page.tsx              # Create category
│   │   └── [categoryId]/
│   │       └── edit/
│   │           └── page.tsx          # Edit category
│   ├── subcategories/
│   │   ├── new/
│   │   │   └── page.tsx              # Create subcategory
│   │   └── [subcategoryId]/
│   │       └── edit/
│   │           └── page.tsx          # Edit subcategory
│   ├── content/
│   │   ├── page.tsx                  # List all content
│   │   ├── new/
│   │   │   └── page.tsx              # Create content item
│   │   └── [contentId]/
│   │       └── edit/
│   │           └── page.tsx          # Edit content item
│   ├── documents/
│   │   └── page.tsx                  # Upload & manage documents
│   └── quizzes/
│       ├── page.tsx                  # List/manage quizzes
│       ├── new/
│       │   └── page.tsx              # Create quiz manually
│       ├── generate/
│       │   └── page.tsx              # AI quiz generation
│       └── [quizId]/
│           ├── edit/
│           │   └── page.tsx          # Edit quiz
│           └── attempts/
│               └── page.tsx          # View all attempts
├── api/
│   ├── chat/
│   │   └── route.ts                  # POST: Send message, get AI response
│   ├── search/
│   │   └── route.ts                  # POST: Semantic search
│   ├── embed/
│   │   └── route.ts                  # POST: Generate embeddings
│   ├── documents/
│   │   ├── upload/
│   │   │   └── route.ts              # POST: Upload document
│   │   └── process/
│   │       └── route.ts              # POST: Process uploaded document
│   └── quizzes/
│       ├── generate/
│       │   └── route.ts              # POST: Generate quiz from content
│       └── submit/
│           └── route.ts              # POST: Submit quiz, get score
└── layout.tsx                        # Root layout with navigation
```

---

## API Routes Detail

### POST /api/chat

Handle chat messages with RAG.

```typescript
// Request
{
  message: string;
  sessionId?: string; // optional, for conversation history
}

// Response
{
  response: string;
  sources: Array<{
    contentItemId: string;
    title: string;
    categoryName: string;
    subcategoryName: string;
    excerpt: string;
  }>;
  sessionId: string;
}
```

**Implementation:**
1. Generate embedding for user's message
2. Query document_chunks with vector similarity (top 10)
3. Build context from matched chunks
4. Send to Claude with system prompt + context + user message
5. Parse response and extract any source references
6. Return response with sources

### POST /api/search

Semantic search across knowledge base.

```typescript
// Request
{
  query: string;
  limit?: number; // default 10
  categoryId?: string; // optional filter
}

// Response
{
  results: Array<{
    contentItemId: string;
    title: string;
    excerpt: string;
    similarity: number;
    category: string;
    subcategory: string;
  }>;
}
```

### POST /api/embed

Generate and store embeddings for content.

```typescript
// Request
{
  contentItemId: string;
}

// Response
{
  success: boolean;
  chunksCreated: number;
}
```

**Implementation:**
1. Fetch content item
2. Split into chunks (500-1000 tokens)
3. Generate embedding for each chunk via Claude/OpenAI
4. Store in document_chunks table

### POST /api/documents/upload

Upload a document file.

```typescript
// Request: FormData with file

// Response
{
  documentId: string;
  filename: string;
  status: 'pending';
}
```

### POST /api/documents/process

Process an uploaded document (parse, chunk, embed).

```typescript
// Request
{
  documentId: string;
  targetSubcategoryId: string;
  title: string; // title for the content item
}

// Response
{
  success: boolean;
  contentItemId: string;
  chunksCreated: number;
}
```

### POST /api/quizzes/generate

Generate quiz questions from content using AI.

```typescript
// Request
{
  contentItemIds?: string[]; // specific items
  subcategoryId?: string; // or entire subcategory
  questionCount?: number; // default 10
  questionTypes?: ('multiple_choice' | 'true_false' | 'short_answer')[];
}

// Response
{
  title: string; // suggested title
  questions: Array<{
    questionText: string;
    questionType: string;
    correctAnswer: string;
    options?: string[];
    explanation: string;
  }>;
}
```

### POST /api/quizzes/submit

Submit quiz answers and get score.

```typescript
// Request
{
  quizId: string;
  userName: string;
  userEmail?: string;
  answers: Record<string, string>; // { questionId: answer }
  timeTakenSeconds?: number;
}

// Response
{
  attemptId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  results: Array<{
    questionId: string;
    correct: boolean;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
  }>;
}
```

---

## AI System Prompts

### Chat System Prompt

```
You are a helpful AI assistant for the Art department at a screen printing company. Your role is to answer questions about department processes, procedures, and training materials.

KNOWLEDGE AREAS:
- Design templates and how to create them
- Printing techniques, especially discharge printing
- Color palettes and ink specifications  
- Discharge rates for different materials
- Job roles and responsibilities (intern through senior designer)
- Onboarding and training procedures
- Standard Operating Procedures (SOPs)
- Art Request Forms (ARF) guidelines
- Quality control and CSI prevention

INSTRUCTIONS:
1. Use ONLY the provided context to answer questions
2. If the answer isn't in the context, say "I don't have information about that in my knowledge base. You may want to check with your supervisor or look in [suggest relevant area]."
3. Be specific and practical in your answers
4. Reference source documents when relevant (e.g., "According to the Discharge Printing guide...")
5. Keep answers concise but complete
6. If asked about something outside work (personal questions, general knowledge), politely redirect to work-related topics

TONE:
- Professional but friendly
- Helpful and patient
- Clear and direct

CONTEXT FROM KNOWLEDGE BASE:
{context}

USER QUESTION:
{question}
```

### Quiz Generation System Prompt

```
You are creating a training quiz for employees at a screen printing company's Art department.

Based on the following content, generate {questionCount} quiz questions.

REQUIREMENTS:
1. Questions should test practical knowledge that employees need
2. Mix difficulty levels (some easy recall, some application)
3. Multiple choice questions should have 4 options with only one correct answer
4. True/False questions should be clearly true or false, not ambiguous
5. Short answer questions should have a specific expected answer
6. Include an explanation for each question that teaches why the answer is correct

QUESTION TYPES TO GENERATE:
{questionTypes}

OUTPUT FORMAT (JSON):
{
  "title": "Suggested quiz title",
  "questions": [
    {
      "questionText": "The question",
      "questionType": "multiple_choice",
      "correctAnswer": "The correct answer",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "explanation": "Why this is the correct answer and what to remember"
    }
  ]
}

CONTENT TO BASE QUESTIONS ON:
{content}
```

---

## UI Components Needed

### Layout Components
- `Navigation` - Top nav with logo, links to Chat, Browse, Quizzes, Admin
- `Sidebar` - Admin sidebar navigation
- `Breadcrumbs` - Show current location in hierarchy
- `PageHeader` - Consistent page titles and descriptions

### Chat Components
- `ChatInterface` - Main chat container
- `ChatMessage` - Individual message bubble (user/assistant)
- `ChatInput` - Message input with send button
- `SourceCard` - Show referenced sources
- `SuggestedQuestions` - Example questions to get started

### Content Components
- `CategoryCard` - Display category in grid
- `SubcategoryList` - List subcategories
- `ContentViewer` - Render markdown content
- `SearchBar` - Global search input
- `ContentEditor` - Markdown editor for admin

### Quiz Components
- `QuizCard` - Quiz preview card
- `QuizQuestion` - Single question display
- `QuizProgress` - Progress bar during quiz
- `QuizResults` - Score and breakdown display
- `QuizGenerator` - AI generation interface

### Admin Components
- `DataTable` - Sortable, filterable table
- `FormField` - Consistent form inputs
- `FileUpload` - Drag-and-drop file upload
- `StatusBadge` - Show processing status
- `ConfirmDialog` - Confirmation modals

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional: OpenAI for embeddings (alternative to Claude)
# OPENAI_API_KEY=your_openai_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Development Priorities (MVP Order)

### Phase 1: Foundation (Week 1)
1. ✅ Next.js project setup with TypeScript
2. ✅ Supabase project and database schema
3. ✅ Basic layout and navigation
4. ✅ shadcn/ui component setup

### Phase 2: Content Management (Week 1-2)
5. ✅ Admin: Categories CRUD
6. ✅ Admin: Subcategories CRUD  
7. ✅ Admin: Content Items CRUD with markdown editor
8. ✅ Browse pages (categories, subcategories, content)

### Phase 3: AI Chat (Week 2)
9. ✅ Embedding generation for content
10. ✅ Vector search implementation
11. ✅ Chat API with RAG
12. ✅ Chat UI interface

### Phase 4: Quizzes (Week 3)
13. ✅ Quiz CRUD (manual creation)
14. ✅ AI quiz generation
15. ✅ Quiz taking interface
16. ✅ Results and scoring

### Phase 5: Documents (Week 3-4)
17. ✅ File upload to Supabase storage
18. ✅ PDF parsing
19. ✅ Document processing pipeline
20. ✅ Admin document management

### Phase 6: Polish (Week 4)
21. ✅ Search functionality
22. ✅ Error handling and loading states
23. ✅ Mobile responsiveness
24. ✅ Sample seed data

---

## Sample Seed Data

Include seed data script that creates:

```typescript
// Sample categories
const categories = [
  { name: 'Discharge Printing', icon: '🎨', description: 'Everything about discharge printing techniques' },
  { name: 'Templates', icon: '📐', description: 'Template creation and standards' },
  { name: 'Job Descriptions', icon: '👤', description: 'Role responsibilities and expectations' },
  { name: 'Onboarding', icon: '🚀', description: 'New employee training materials' },
  { name: 'SOPs', icon: '📋', description: 'Standard Operating Procedures' },
];

// Sample subcategories under "Discharge Printing"
const dischargeSubcategories = [
  { name: 'Heather Materials', description: 'Working with heather fabrics' },
  { name: 'Tri-Blends', description: 'Tri-blend material specifications' },
  { name: 'Color Matching', description: 'Achieving accurate colors' },
];

// Sample content item
const sampleContent = {
  title: 'Discharge Rates for Heather Royal',
  content: `
# Discharge Rates for Heather Royal

## Overview
Heather Royal is one of our most common materials. Proper discharge rates are critical for quality output.

## Recommended Settings
- **Discharge Rate:** 85-90%
- **Mesh Count:** 110
- **Squeegee Pressure:** Medium
- **Flash Time:** 3-4 seconds

## Common Issues
1. **Underdischarge:** Results in dull colors. Increase rate or flash time.
2. **Overdischarge:** Can damage fabric. Reduce rate.
3. **Uneven discharge:** Check squeegee angle and pressure.

## Tips
- Always test on scrap fabric first
- Heather materials require slightly higher discharge rates than solid colors
- Environmental humidity affects results - adjust accordingly
  `
};
```

---

## Deliverables Checklist

When complete, the project should include:

- [ ] Fully functional Next.js 14 application
- [ ] All pages listed in page structure
- [ ] All API routes implemented
- [ ] Supabase database with schema applied
- [ ] Working AI chat with RAG
- [ ] Quiz generation and taking
- [ ] Admin content management
- [ ] Document upload and processing
- [ ] Mobile responsive design
- [ ] README.md with setup instructions
- [ ] Seed data script
- [ ] Environment variables template (.env.example)

---

## Notes for Implementation

1. **Keep it simple** - This is an MVP. Avoid over-engineering.

2. **Intuitive UI** - Users should find what they need without training. Clear labels, obvious buttons, minimal clicks.

3. **Fast responses** - Show loading states. Stream AI responses if possible.

4. **Error handling** - Graceful errors with helpful messages. Never show raw error objects.

5. **No auth for MVP** - Admin pages are accessible without login. This will be added later.

6. **Mobile first** - Many users will access on phones/tablets.

7. **Extensible** - Structure code so features can be added (gamification, user accounts, integrations) without major refactoring.

---

## Future Features (Not in MVP)

These are mentioned for context but should NOT be built now:

- User authentication and accounts
- Gamification (badges, points, leaderboards)
- Learning paths / progression tracking
- Slack integration
- Salesforce integration
- Client-facing FAQ portal
- Multi-department support
- Role-based access control
- Analytics dashboard
- Email notifications
