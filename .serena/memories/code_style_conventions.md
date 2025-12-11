# Code Style & Conventions

## TypeScript Configuration
- **Target**: ES2017
- **Strict Mode**: Enabled
- **Module**: ESNext with bundler resolution
- **Path Aliases**: `@/*` maps to root directory

## Naming Conventions
- **Files**: kebab-case (e.g., `chat-interface.tsx`, `vector-search.ts`)
- **Components**: PascalCase (e.g., `ChatInterface`, `QuizCard`)
- **Functions**: camelCase (e.g., `generateEmbeddings`, `semanticSearch`)
- **Constants**: UPPER_SNAKE_CASE for system constants (e.g., `SYSTEM_PROMPT`)

## Component Organization
```
components/
├── ui/          # shadcn/ui primitives (button, dialog, etc.)
├── layout/      # Navigation, breadcrumbs, sidebar
├── chat/        # Chat interface components
├── content/     # Content display, markdown rendering
├── quiz/        # Quiz interface components
└── admin/       # Admin CRUD forms
```

## API Route Pattern
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

**Critical**: Always use `supabaseAdmin` (service role) in API routes, never client-side `supabase`.

## React Patterns
- **Server Components**: Default for data fetching (Next.js 15)
- **Client Components**: Use `'use client'` directive only for interactivity
- **Form State**: `react-hook-form` for forms
- **Toasts**: Custom hook via `hooks/use-toast.ts`
- **No Global State**: No Redux/Zustand - Server Components for data

## ESLint
- Configuration: `next/core-web-vitals` (minimal rules)
- Run with: `npm run lint`
