# Art Department Knowledge Base

An AI-powered knowledge base application for employee onboarding and training, featuring RAG (Retrieval Augmented Generation) chat, automated quiz generation, and document processing.

## 🌟 Features

### 💬 AI-Powered Chat
- Real-time chat interface with streaming responses
- RAG (Retrieval Augmented Generation) using vector search
- Source citations for all answers
- Suggested questions for new users

### 📚 Knowledge Base Management
- Hierarchical content organization (Categories → Subcategories → Content)
- Markdown editor with live preview
- Automatic embedding generation for semantic search
- Browse interface for manual content discovery

### 📝 Quiz System
- Manual quiz creation with multiple question types
- AI-powered quiz generation from content using Claude
- Question types: multiple choice, true/false, short answer
- Timer support and progress tracking
- Results with explanations and score breakdown
- Attempt tracking and analytics

### 📄 Document Processing
- Upload PDF, DOCX, and Markdown files
- Automatic text extraction and parsing
- Chunking and embedding generation
- Integration with knowledge base content

### 🔍 Vector Search
- Semantic search using OpenAI embeddings
- pgvector for efficient similarity search
- Context-aware retrieval for accurate responses

## 🏗️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL + pgvector)
- **AI:** Claude API (Anthropic) for chat and quiz generation
- **Embeddings:** OpenAI text-embedding-3-small
- **UI:** Tailwind CSS + shadcn/ui
- **Document Parsing:** pdf-parse, mammoth, gray-matter
- **Markdown:** react-markdown, @uiw/react-md-editor

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Anthropic API key (Claude)
- OpenAI API key (for embeddings)

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd SC-ART-ChatBot
npm install
```

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema:

```sql
-- Copy and paste contents of supabase/schema.sql
```

3. Create storage bucket for documents:

```sql
-- Copy and paste contents of supabase/migrations/create_documents_storage.sql
```

4. Get your API keys from Project Settings → API

### 3. Setup Environment Variables

Create `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-your_key_here

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-your_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Seed Sample Data (Optional)

```bash
npm run seed
```

This creates sample categories, content, and a quiz to get started.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
SC-ART-ChatBot/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Chat interface (home)
│   ├── layout.tsx                # Root layout
│   ├── browse/                   # Browse knowledge base
│   ├── content/                  # View content items
│   ├── quizzes/                  # Quiz pages
│   ├── admin/                    # Admin dashboard
│   │   ├── categories/           # Category management
│   │   ├── subcategories/        # Subcategory management
│   │   ├── content/              # Content management
│   │   ├── quizzes/              # Quiz management
│   │   └── documents/            # Document upload
│   └── api/                      # API routes
│       ├── chat/                 # Chat endpoint
│       ├── search/               # Semantic search
│       ├── embed/                # Embedding generation
│       ├── categories/           # Category CRUD
│       ├── subcategories/        # Subcategory CRUD
│       ├── content/              # Content CRUD
│       ├── quizzes/              # Quiz CRUD & generation
│       └── documents/            # Document upload & processing
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/                   # Navigation, breadcrumbs
│   ├── chat/                     # Chat components
│   ├── content/                  # Content display
│   ├── quiz/                     # Quiz components
│   └── admin/                    # Admin forms
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── openai.ts                 # OpenAI embeddings
│   ├── anthropic.ts              # Claude API
│   ├── embeddings.ts             # Embedding generation
│   ├── vector-search.ts          # Semantic search
│   ├── document-parser.ts        # Document parsing
│   └── utils.ts                  # Utilities
├── scripts/
│   └── seed.ts                   # Database seeding
└── supabase/
    ├── schema.sql                # Database schema
    └── migrations/               # SQL migrations
```

## 🎯 Usage Guide

### Admin Dashboard

Access at `/admin` to manage your knowledge base:

1. **Categories** - Create top-level organization
2. **Content** - Add knowledge base articles with markdown
3. **Quizzes** - Create quizzes manually or generate with AI
4. **Documents** - Upload PDF/DOCX/MD files for processing

### Creating Content

1. Go to `/admin/content`
2. Click "Add Content"
3. Select category and subcategory
4. Write content in markdown
5. Click "Generate Embeddings" to enable semantic search

### AI Quiz Generation

1. Go to `/admin/quizzes/generate`
2. Select content items or entire subcategory
3. Choose question count and types
4. AI generates quiz questions
5. Review and edit before publishing

### Document Processing

1. Go to `/admin/documents`
2. Select target subcategory
3. Enter content title
4. Upload PDF, DOCX, or MD file
5. Click "Process" to extract and embed content

## 🔧 Configuration

### Embedding Settings

Adjust chunking parameters in `lib/embeddings.ts`:

```typescript
export function chunkText(
  text: string,
  maxTokens: number = 800,    // Chunk size
  overlap: number = 100        // Overlap between chunks
)
```

### Vector Search

Tune search parameters in `lib/vector-search.ts`:

```typescript
const results = await semanticSearch(
  query,
  limit = 10,           // Number of results
  categoryId            // Optional filter
);
```

### Chat System Prompt

Customize AI behavior in `app/api/chat/route.ts`:

```typescript
const SYSTEM_PROMPT = `You are a helpful AI assistant...`;
```

## 🗄️ Database Schema

### Core Tables

- **categories** - Top-level content organization
- **subcategories** - Nested under categories
- **content_items** - Knowledge base articles
- **document_chunks** - Text chunks with embeddings (vector)
- **quizzes** - Quiz metadata
- **quiz_questions** - Individual questions
- **quiz_attempts** - User quiz submissions
- **uploaded_documents** - Document upload tracking

### Key Features

- **pgvector** extension for vector similarity search
- **IVFFlat** index for efficient searches
- Cascading deletes to maintain referential integrity
- Automatic `updated_at` triggers

## 📊 API Reference

### Chat API

**POST** `/api/chat`
```json
{
  "message": "What's the discharge rate for Heather Royal?"
}
```

Returns streaming response with sources.

### Search API

**POST** `/api/search`
```json
{
  "query": "discharge printing",
  "limit": 10
}
```

### Embedding Generation

**POST** `/api/embed`
```json
{
  "contentItemId": "uuid"
}
```

### Quiz Generation

**POST** `/api/quizzes/generate`
```json
{
  "contentItemIds": ["uuid1", "uuid2"],
  "questionCount": 10,
  "questionTypes": ["multiple_choice", "true_false"]
}
```

## 🐛 Troubleshooting

### Embeddings Not Generated

1. Check OpenAI API key in `.env.local`
2. Verify content item exists
3. Check console for error messages
4. Ensure sufficient OpenAI credits

### Vector Search Returns No Results

1. Verify embeddings have been generated
2. Check pgvector extension is enabled
3. Verify IVFFlat index exists
4. Lower similarity threshold in search

### Document Processing Fails

1. Check file type (PDF, DOCX, MD only)
2. Verify file size < 10MB
3. Check Supabase Storage is configured
4. Review error message in uploaded_documents table

### Chat Responses Slow

1. Check Claude API rate limits
2. Reduce number of chunks retrieved (default: 10)
3. Consider caching frequent queries
4. Monitor API usage in Anthropic dashboard

## 🚀 Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Supabase Production

1. Create production Supabase project
2. Run migrations
3. Update environment variables
4. Configure RLS policies if needed

### Post-Deployment

1. Run seed script to populate data
2. Test all features
3. Monitor API usage (Claude, OpenAI)
4. Set up error tracking (Sentry, LogRocket)

## 📈 Performance Tips

### Embedding Optimization

- Batch embed multiple content items
- Cache embeddings for unchanged content
- Use smaller chunk sizes for faster searches

### Vector Search

- Adjust IVFFlat index `lists` parameter based on dataset size
- Pre-filter by category before vector search
- Limit results to top 10-20

### API Rate Limits

- Implement retry logic with exponential backoff
- Queue background jobs for bulk operations
- Monitor usage and set up alerts

## 🔒 Security Considerations

- Service role key is for server-side only
- Markdown content is sanitized before rendering
- File uploads are validated (type and size)
- No authentication for MVP (add for production)
- Enable RLS policies in Supabase for production

## 📚 Additional Documentation

- [QUIZ_SYSTEM.md](./QUIZ_SYSTEM.md) - Quiz system documentation
- [DOCUMENT_UPLOAD_SYSTEM.md](./DOCUMENT_UPLOAD_SYSTEM.md) - Document processing guide
- [DOCUMENT_UPLOAD_CHECKLIST.md](./DOCUMENT_UPLOAD_CHECKLIST.md) - Testing checklist

## 🤝 Contributing

This is an internal project. For questions or issues, contact the development team.

## 📝 License

Proprietary - Internal use only

## 🎉 Credits

Built with Next.js, Supabase, Claude AI, and OpenAI.

---

**Happy Knowledge Sharing! 📚✨**
