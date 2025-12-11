# Task Completion Checklist

## Before Marking Task Complete

### 1. Code Quality
- [ ] Run `npm run lint` - ESLint must pass
- [ ] TypeScript compilation successful (check with `npm run build`)
- [ ] No console errors or warnings in development mode
- [ ] Code follows naming conventions (kebab-case files, PascalCase components)

### 2. Validation Gates
- [ ] If API route: uses `supabaseAdmin` (not client `supabase`)
- [ ] If embedding-related: verify embeddings generated successfully
- [ ] If document processing: test with sample PDF/DOCX/MD
- [ ] If chat-related: verify RAG context retrieval working
- [ ] If quiz-related: verify question generation quality

### 3. Testing (Manual)
- [ ] Test in browser at http://localhost:3000
- [ ] Verify functionality with seeded data (`npm run seed` if needed)
- [ ] Check console for errors
- [ ] Test edge cases (empty inputs, invalid data, etc.)

### 4. Documentation
- [ ] Update CLAUDE.md if architecture changes
- [ ] Add comments for complex logic
- [ ] Update TypeScript interfaces if schema changes

### 5. Git Workflow
- [ ] Check `git status` - verify changes are intentional
- [ ] Review `git diff` before committing
- [ ] Create feature branch (never work on main)
- [ ] Commit with descriptive message

## When Task Complete
1. Verify all checklist items above
2. Clean up temporary files/debugging code
3. Commit changes with meaningful message
4. Update project documentation if needed
5. Test one final time before marking complete
