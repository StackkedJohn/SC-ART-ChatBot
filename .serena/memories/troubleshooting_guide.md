# Troubleshooting Guide

## Embeddings Not Generating
**Symptoms**: Content added but not searchable in chat
**Diagnosis**:
1. Check `OPENAI_API_KEY` is valid in `.env.local`
2. Verify OpenAI account has credits
3. Check console errors in `app/api/embed/route.ts`
4. Ensure content item exists and has content

**Fix**: 
- Verify API key: `console.log(process.env.OPENAI_API_KEY)` in API route
- Check content: Query `content_items` table for `last_embedded_at` field

## Vector Search Returns No Results
**Symptoms**: Chat returns generic responses, no sources
**Diagnosis**:
1. Verify embeddings exist: `SELECT COUNT(*) FROM document_chunks`
2. Check pgvector extension: `SELECT * FROM pg_extension WHERE extname = 'vector'`
3. Verify IVFFlat index: `SELECT * FROM pg_indexes WHERE tablename = 'document_chunks'`
4. Lower `match_threshold` in search function (default 0.3)

**Fix**:
- Re-generate embeddings via admin panel
- Check `searchResults` in `/api/chat/route.ts` debug logs
- Verify `SYSTEM_PROMPT` is appropriate for domain

## Chat Responses Are Generic/Incorrect
**Symptoms**: Chat doesn't use knowledge base content
**Diagnosis**:
1. Verify RAG is working: Check `searchResults` in `/api/chat/route.ts`
2. Ensure content has been embedded (check `last_embedded_at`)
3. Review `SYSTEM_PROMPT` - may need domain tuning
4. Check Claude API usage limits (console.anthropic.com)

**Fix**:
- Add debug logging to verify semantic search results
- Check chunk retrieval count (default: top 10 chunks)
- Adjust similarity threshold if needed

## Document Upload Fails
**Symptoms**: Upload returns error or hangs
**Diagnosis**:
1. File type must be PDF, DOCX, or MD
2. File size limit: 10MB (Supabase storage default)
3. Check `uploaded_documents` table `status` and `error_message`
4. Verify Supabase Storage bucket `documents` exists and is public

**Fix**:
- Check Supabase Storage bucket configuration
- Verify file parsing in `lib/document-parser.ts`
- Check console errors in `app/api/documents/process/route.ts`

## Build/Development Issues

### TypeScript Errors
```bash
npm run build  # Check for compilation errors
```
- Verify all imports are correct
- Check TypeScript interfaces match database schema
- Ensure `paths` in `tsconfig.json` are correct (`@/*`)

### Missing Dependencies
```bash
npm install  # Reinstall all dependencies
```
- Delete `node_modules` and `.next` if issues persist
- Verify Node.js version compatibility

### Environment Variables Not Loading
- Ensure `.env.local` exists in project root
- Restart dev server after `.env.local` changes
- Check variable names match exactly (case-sensitive)

## Database Issues

### Supabase Connection Fails
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (server-side only)

### Schema Changes Not Reflected
- Re-run schema SQL in Supabase SQL Editor
- Check migrations in `supabase/migrations/`
- Verify cascading deletes are properly configured

## Performance Issues

### Slow Chat Responses
- Check OpenAI embedding API latency
- Verify Claude API response times
- Check database query performance (pgvector index)
- Review chunk retrieval count (default: 10)

### Slow Vector Search
- Ensure IVFFlat index exists on `document_chunks.embedding`
- Tune index parameters: `lists = 100` (adjust for dataset size)
- Check query execution plan with `EXPLAIN ANALYZE`
