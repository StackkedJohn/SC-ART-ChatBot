# SC-ART ChatBot Suggested Commands

## Development Commands

### Core Development
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Database & Seeding
```bash
npm run seed         # Seed database with sample data (requires .env.local)
```

### Testing
No automated test suite currently. Manual testing workflow:
1. `npm run seed` - Seed database
2. Test chat with seeded content
3. Test embeddings generation
4. Test quiz generation
5. Test document upload (PDF/DOCX/MD)

## Git Commands (Windows)
```bash
git status           # Check repository status
git branch           # List branches
git checkout -b feature/name  # Create new feature branch
git add .            # Stage changes
git commit -m "msg"  # Commit changes
git push             # Push to remote
```

## Windows Utility Commands
```bash
dir                  # List directory contents
cd path              # Change directory
type file            # Display file contents
findstr "text" file  # Search for text in file
```

## Database Setup (First Run)
1. Create Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Run `supabase/migrations/create_documents_storage.sql`
4. Configure `.env.local` with credentials

## Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
