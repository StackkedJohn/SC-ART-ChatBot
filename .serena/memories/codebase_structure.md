# Codebase Structure

## Directory Layout
```
SC-ART-ChatBot/
├── app/                    # Next.js 15 App Router
│   ├── admin/              # Admin CRUD pages
│   │   ├── categories/     # Category management
│   │   ├── subcategories/  # Subcategory management
│   │   ├── content/        # Content item management
│   │   ├── quizzes/        # Quiz management
│   │   └── documents/      # Document upload
│   ├── api/                # API routes (server-side)
│   │   ├── categories/     # Category CRUD
│   │   ├── subcategories/  # Subcategory CRUD
│   │   ├── content/        # Content CRUD
│   │   ├── quizzes/        # Quiz CRUD + generation
│   │   ├── documents/      # Document upload/processing
│   │   ├── chat/           # RAG chat streaming
│   │   ├── embed/          # Embedding generation
│   │   └── search/         # Vector search
│   ├── browse/             # Public browsing interface
│   ├── content/            # Content display pages
│   ├── quizzes/            # Quiz taking interface
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # Navigation, breadcrumbs
│   ├── chat/               # Chat components
│   ├── content/            # Content display
│   ├── quiz/               # Quiz components
│   └── admin/              # Admin forms
├── lib/                    # Utility libraries
│   ├── supabase.ts         # Supabase client config
│   ├── anthropic.ts        # Claude API wrapper
│   ├── openai.ts           # OpenAI embeddings
│   ├── embeddings.ts       # Chunking + embedding generation
│   ├── vector-search.ts    # Semantic search
│   └── document-parser.ts  # PDF/DOCX/MD parsing
├── supabase/               # Database schema
│   ├── schema.sql          # Main schema
│   └── migrations/         # Database migrations
├── scripts/                # Utility scripts
│   └── seed.ts             # Database seeding
└── hooks/                  # React hooks
    └── use-toast.ts        # Toast notifications
```

## Key Integration Points

### RAG Pipeline
1. `lib/embeddings.ts` - Chunking (800 tokens, 100 overlap) + embedding generation
2. `lib/vector-search.ts` - Semantic search via pgvector
3. `app/api/chat/route.ts` - RAG orchestration + streaming
4. `lib/anthropic.ts` - Claude API wrapper with streaming

### Document Processing
1. `app/api/documents/upload/route.ts` - Upload to Supabase Storage
2. `app/api/documents/process/route.ts` - Extract text (PDF/DOCX/MD)
3. `lib/document-parser.ts` - Parsing logic
4. `app/api/embed/route.ts` - Generate embeddings automatically

### AI Services
- **Claude (Anthropic)**: `lib/anthropic.ts` - Chat + quiz generation
- **OpenAI**: `lib/openai.ts` - Embeddings only (text-embedding-3-small)

## Database Schema Key Tables
- `categories` - Top-level organization
- `subcategories` - Nested within categories
- `content_items` - Knowledge base articles
- `document_chunks` - Text chunks with embeddings (vector(1536))
- `quizzes` - Quiz metadata
- `quiz_questions` - Questions with answers
- `quiz_attempts` - User quiz results
- `uploaded_documents` - Document upload tracking
