# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SC-ART ChatBot is an AI-powered knowledge base application for employee onboarding and training in a screen printing company's Art department. It combines RAG (Retrieval Augmented Generation) chat, automated quiz generation, and document processing using Next.js 15, Supabase, Claude AI, and OpenAI embeddings.

## Development Commands

### Running the Application
```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run seed         # Seed database with sample data (requires .env.local configured)
npm run fix-general  # Fix "General" subcategory naming issue (see SUBCATEGORY_FIX.md)
```

### Database Setup
The application requires Supabase database setup before first run:
1. Create Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Run `supabase/migrations/create_documents_storage.sql` for document storage bucket
4. Configure `.env.local` with Supabase credentials

## Architecture Overview

### Data Flow & RAG System

**RAG Pipeline (Retrieval Augmented Generation):**
1. **Content → Embeddings Pipeline**: Content items are chunked (800 tokens, 100 overlap) → OpenAI embeddings generated → Stored in `document_chunks` table with pgvector
2. **Query Flow**: User question → OpenAI embedding → pgvector cosine similarity search → Top 10 relevant chunks retrieved → Context built → Sent to Claude with system prompt
3. **Response Streaming**: Claude streams response via Server-Sent Events → Sources from search results returned at end

**Key Integration Points:**
- `lib/embeddings.ts`: Chunking + embedding generation
- `lib/vector-search.ts`: Semantic search via pgvector
- `app/api/chat/route.ts`: RAG orchestration + streaming
- `lib/anthropic.ts`: Claude API wrapper with streaming

### Database Schema Hierarchy

```
categories (top-level)
└── subcategories (nested)
    ├── content_items (knowledge base articles)
    │   └── document_chunks (text chunks + embeddings for RAG)
    └── quizzes (optional association)
        ├── quiz_questions
        └── quiz_attempts
```

**Critical Schema Details:**
- `document_chunks.embedding` is `vector(1536)` - matches OpenAI text-embedding-3-small dimension
- IVFFlat index on embeddings for fast similarity search
- Cascading deletes maintain referential integrity
- `last_embedded_at` tracks when content was last vectorized

### AI Services Architecture

**Two AI Systems:**
1. **Claude (Anthropic)**: Chat responses + quiz generation
   - Streaming chat via `app/api/chat/route.ts`
   - Quiz generation via `app/api/quizzes/generate/route.ts`
   - Uses RAG context for accurate domain-specific answers

2. **OpenAI**: Embeddings only
   - `text-embedding-3-small` model (1536 dimensions)
   - Used for both content vectorization and query embedding
   - Batched embedding generation in `lib/openai.ts`

### Document Processing Pipeline

**Upload → Process → Embed Workflow:**
1. File uploaded to Supabase Storage (`uploaded_documents` table tracks)
2. `app/api/documents/process/route.ts` extracts text:
   - PDF via `pdf-parse`
   - DOCX via `mammoth`
   - Markdown via `gray-matter` (supports frontmatter)
3. Text saved as `content_item` in target subcategory
4. Embedding generation triggered automatically
5. Content becomes searchable in chat

## Key Implementation Patterns

### API Route Pattern
All API routes follow this structure:
```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Validation
    // Supabase operations using supabaseAdmin (server-side)
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'message' }, { status: 500 });
  }
}
```

**Critical**: Always use `supabaseAdmin` (service role) in API routes for database operations, never client-side `supabase`.

### Streaming Response Pattern (Chat)
Chat uses Server-Sent Events for streaming:
```typescript
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of chatStream) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
    }
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sources, done: true })}\n\n`));
    controller.close();
  }
});
```

### Vector Embedding Pattern
When content changes, regenerate embeddings:
```typescript
// 1. Delete old chunks
await supabaseAdmin.from('document_chunks').delete().eq('content_item_id', id);
// 2. Chunk text (800 tokens, 100 overlap)
const chunks = chunkText(fullText, 800, 100);
// 3. Generate embeddings (batched)
const embeddings = await generateEmbeddings(chunks);
// 4. Insert with Postgres vector format
const chunkRecords = chunks.map((chunk, index) => ({
  embedding: `[${embeddings[index].join(',')}]`, // Vector string format
}));
```

## Component Organization

### Directory Structure
- `components/ui/`: shadcn/ui primitives (button, dialog, etc.)
- `components/layout/`: Navigation, breadcrumbs, sidebar
- `components/chat/`: Chat interface, message bubbles, streaming display
- `components/content/`: Content display, markdown rendering
- `components/quiz/`: Quiz taking interface, question types, results
- `components/admin/`: Admin forms for CRUD operations

### State Management
No global state library - uses React Server Components where possible:
- Server Components for data fetching (default in Next.js 15)
- Client Components (`'use client'`) only for interactivity (chat, forms)
- Form state via `react-hook-form`
- Toast notifications via `hooks/use-toast.ts`

## Environment Variables Required

```env
# Supabase (get from project settings)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx  # Server-side only

# Claude AI (get from console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-xxx

# OpenAI (get from platform.openai.com)
OPENAI_API_KEY=sk-xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Common Development Workflows

### Adding New Content Types
1. Extend database schema in `supabase/schema.sql`
2. Add TypeScript interfaces in `lib/supabase.ts`
3. Create API routes in `app/api/[resource]/route.ts`
4. Build admin forms in `components/admin/`
5. Add public views in `app/[resource]/`

### Modifying RAG Behavior
- **Chunk size**: Adjust `maxTokens` parameter in `chunkText()` (default 800)
- **Search results**: Change `limit` parameter in `semanticSearch()` (default 10)
- **Similarity threshold**: Modify `match_threshold` in `search_document_chunks` RPC (default 0.3)
- **System prompt**: Edit `SYSTEM_PROMPT` constant in `app/api/chat/route.ts`

### Quiz Generation Tuning
AI quiz generation is controlled in `lib/anthropic.ts`:
- Question types: `multiple_choice`, `true_false`, `short_answer`
- Question count: Specified in API request (default 10)
- Difficulty: Adjust prompt in `generateQuizQuestions()` function

## Testing Approach

No automated test suite currently. Manual testing workflow:
1. Seed database: `npm run seed`
2. Test chat: Ask questions about seeded content
3. Test embeddings: Generate embeddings for content, verify search results
4. Test quiz generation: Generate quiz from content, verify question quality
5. Test document upload: Upload PDF/DOCX, verify parsing and embedding

## Performance Considerations

### Embedding Generation
- Batched API calls to OpenAI (all chunks in one request)
- Cost: ~$0.0001 per 1K tokens (text-embedding-3-small)
- Time: ~1-2 seconds for typical article (2000 tokens → ~3 chunks)

### Vector Search
- IVFFlat index accelerates similarity search
- Index tuning: `lists = 100` (adjust based on dataset size)
- Query time: <100ms for typical search (10K chunks)

### Chat Streaming
- Chunks sent as Server-Sent Events for responsive UX
- Sources sent at end to avoid blocking response
- Claude API rate limits apply (check Anthropic dashboard)

## Security Notes

**No Authentication System (MVP)**
- Application is open access - suitable for internal deployment only
- For production: Add authentication (NextAuth.js, Clerk, Supabase Auth)
- Enable Row Level Security (RLS) in Supabase for production

**API Key Security:**
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS - server-side only, never expose to client
- Keep API keys in `.env.local`, never commit
- Markdown rendering uses `rehype-sanitize` to prevent XSS

## Troubleshooting

### Embeddings Not Generating
1. Check `OPENAI_API_KEY` is valid
2. Verify OpenAI account has credits
3. Check console for error messages in `app/api/embed/route.ts`
4. Ensure content item exists and has content

### Vector Search Returns No Results
1. Verify embeddings exist: `SELECT COUNT(*) FROM document_chunks`
2. Check pgvector extension: `SELECT * FROM pg_extension WHERE extname = 'vector'`
3. Verify IVFFlat index: `SELECT * FROM pg_indexes WHERE tablename = 'document_chunks'`
4. Lower `match_threshold` in search function (default 0.3)

### Chat Responses Are Generic/Incorrect
1. Verify RAG is working: Check `searchResults` in `/api/chat/route.ts`
2. Ensure content has been embedded (check `last_embedded_at` field)
3. Review `SYSTEM_PROMPT` - may need tuning for domain
4. Check Claude API usage limits (console.anthropic.com)

### Categories Show Only "General" Subcategory
1. This is a data structure issue, not a code bug
2. Run `npm run fix-general` to automatically rename generic subcategories
3. See [SUBCATEGORY_FIX.md](./SUBCATEGORY_FIX.md) for detailed fix instructions
4. For future content: Create multiple specific subcategories instead of one "General" category

### Document Upload Fails
1. File type must be PDF, DOCX, or MD
2. File size limit: 10MB (Supabase storage default)
3. Check `uploaded_documents` table `status` and `error_message` fields
4. Verify Supabase Storage bucket `documents` exists and is public

## Additional Resources

- [QUIZ_SYSTEM.md](./QUIZ_SYSTEM.md): Detailed quiz system documentation
- [DOCUMENT_UPLOAD_SYSTEM.md](./DOCUMENT_UPLOAD_SYSTEM.md): Document processing architecture
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md): Implementation timeline and decisions
- [art-knowledge-base-prompt.md](./art-knowledge-base-prompt.md): Original AI prompt and requirements
