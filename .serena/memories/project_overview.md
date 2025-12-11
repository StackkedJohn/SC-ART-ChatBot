# SC-ART ChatBot Project Overview

## Purpose
AI-powered knowledge base application for employee onboarding and training in a screen printing company's Art department. Combines RAG (Retrieval Augmented Generation) chat, automated quiz generation, and document processing.

## Tech Stack
- **Framework**: Next.js 15 (App Router, React 18)
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **AI Services**:
  - Claude (Anthropic) - Chat responses + quiz generation
  - OpenAI - Embeddings (text-embedding-3-small, 1536 dimensions)
- **UI**: shadcn/ui (Radix UI primitives) + Tailwind CSS
- **Document Processing**: pdf-parse, mammoth, gray-matter
- **Vector Search**: pgvector with IVFFlat index

## Core Features
1. **RAG Chat System**: Semantic search + streaming chat responses
2. **Quiz Generation**: AI-generated quizzes from content
3. **Document Upload**: PDF/DOCX/Markdown → parsing → embedding → searchable
4. **Knowledge Base**: Hierarchical categories → subcategories → content items

## Database Schema
```
categories (top-level)
└── subcategories (nested)
    ├── content_items (knowledge base articles)
    │   └── document_chunks (text chunks + embeddings for RAG)
    └── quizzes (optional association)
        ├── quiz_questions
        └── quiz_attempts
```

## Key Architecture Points
- Server Components for data fetching (Next.js 15 default)
- Client Components only for interactivity (chat, forms)
- API routes use `supabaseAdmin` (service role) for all DB operations
- Streaming responses via Server-Sent Events for chat
- No authentication system (MVP - internal deployment only)
