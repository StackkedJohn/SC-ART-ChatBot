# Document Upload System - Setup & Testing Checklist

## Pre-Setup Verification

- [ ] Verify `uploaded_documents` table exists in database
- [ ] Verify `content_items` table exists
- [ ] Verify `document_chunks` table exists
- [ ] Check environment variables are set:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `OPENAI_API_KEY`

## Storage Setup

- [ ] Create 'documents' bucket in Supabase Storage
  - [ ] Set bucket as public
  - [ ] Enable RLS on storage.objects
  - [ ] Apply RLS policies from migration file
- [ ] OR Run migration: `supabase/migrations/create_documents_storage.sql`

## File Verification

All 6 required files created:

### Components
- [x] `/components/admin/file-upload.tsx` (5.4K)
- [x] `/components/admin/status-badge.tsx` (1.2K)

### API Routes
- [x] `/app/api/documents/upload/route.ts` (4.6K)
- [x] `/app/api/documents/process/route.ts` (4.7K)
- [x] `/app/api/documents/[documentId]/route.ts` (4.5K)

### Admin Interface
- [x] `/app/admin/documents/page.tsx` (16K)

### Support Files
- [x] `/supabase/migrations/create_documents_storage.sql`
- [x] `/DOCUMENT_UPLOAD_SYSTEM.md` (documentation)
- [x] `/DOCUMENT_UPLOAD_CHECKLIST.md` (this file)

## Testing Steps

### 1. Start Development Server
```bash
npm run dev
```
- [ ] Server starts without errors
- [ ] Navigate to http://localhost:3000/admin/documents
- [ ] Page loads successfully

### 2. Test File Upload Interface
- [ ] File upload dropzone appears
- [ ] Title input field works
- [ ] Subcategory dropdown populated with categories
- [ ] Drag-and-drop functionality works
- [ ] File validation works (try invalid file type)
- [ ] File size validation works (try >10MB file)

### 3. Test Upload Functionality

#### Test PDF Upload
- [ ] Select a PDF file
- [ ] Enter title
- [ ] Select subcategory
- [ ] Click "Upload Document"
- [ ] Document appears in list with "pending" status
- [ ] File uploaded to Supabase Storage bucket

#### Test DOCX Upload
- [ ] Select a DOCX file
- [ ] Verify upload completes successfully
- [ ] Document shows in list

#### Test Markdown Upload
- [ ] Select a .md file
- [ ] Verify upload completes successfully
- [ ] Document shows in list

### 4. Test Processing Functionality

#### Process PDF Document
- [ ] Click "Process" button on pending PDF
- [ ] Status changes to "processing" (blue badge with spinner)
- [ ] Auto-refresh shows status updates
- [ ] Status changes to "completed" (green badge)
- [ ] Chunk count displayed
- [ ] Processed timestamp shown

#### Verify Content Creation
- [ ] Navigate to target subcategory in admin panel
- [ ] Verify content item was created
- [ ] Check content matches uploaded file
- [ ] Verify embeddings were generated

### 5. Test Error Handling

#### Invalid File Upload
- [ ] Try uploading .txt file → Should show error
- [ ] Try uploading .jpg file → Should show error
- [ ] Try uploading >10MB file → Should show error

#### Processing Errors
- [ ] Upload document without selecting subcategory → Should prevent
- [ ] Process document, then delete subcategory → Should fail gracefully
- [ ] Check error message displayed in UI
- [ ] Try "Retry" button on failed document

### 6. Test Document Management

#### Filter Documents
- [ ] Select "All Status" → Shows all documents
- [ ] Select "Pending" → Shows only pending
- [ ] Select "Processing" → Shows only processing
- [ ] Select "Completed" → Shows only completed
- [ ] Select "Failed" → Shows only failed

#### Delete Document
- [ ] Click delete button on a document
- [ ] Confirm deletion dialog appears
- [ ] Document removed from list
- [ ] File deleted from Storage bucket
- [ ] Associated content item deleted
- [ ] Embeddings/chunks deleted

### 7. Test Real-Time Updates
- [ ] Upload document
- [ ] Click process
- [ ] Verify UI updates automatically during processing
- [ ] Status badge changes in real-time
- [ ] No page refresh needed

### 8. API Endpoint Testing

#### GET /api/documents/upload
```bash
curl http://localhost:3000/api/documents/upload
```
- [ ] Returns list of documents
- [ ] Proper JSON structure

#### POST /api/documents/upload
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@test.pdf" \
  -F "subcategoryId=UUID" \
  -F "title=Test Document"
```
- [ ] Returns success response
- [ ] Document created in database

#### POST /api/documents/process
```bash
curl -X POST http://localhost:3000/api/documents/process \
  -H "Content-Type: application/json" \
  -d '{"documentId": "UUID"}'
```
- [ ] Processing starts
- [ ] Returns success response

#### DELETE /api/documents/[documentId]
```bash
curl -X DELETE http://localhost:3000/api/documents/UUID
```
- [ ] Document deleted
- [ ] Returns success response

### 9. Database Verification

#### Check uploaded_documents table
```sql
SELECT * FROM uploaded_documents ORDER BY created_at DESC LIMIT 5;
```
- [ ] Records created with correct status
- [ ] file_url populated
- [ ] metadata stored correctly

#### Check content_items table
```sql
SELECT * FROM content_items WHERE id IN (
  SELECT metadata->>'content_item_id' FROM uploaded_documents WHERE status = 'completed'
);
```
- [ ] Content items created
- [ ] Content extracted correctly

#### Check document_chunks table
```sql
SELECT COUNT(*), content_item_id FROM document_chunks
GROUP BY content_item_id;
```
- [ ] Chunks created
- [ ] Embeddings generated
- [ ] Proper chunk counts

#### Check Storage bucket
- [ ] Files visible in Supabase Storage UI
- [ ] Files accessible via public URL
- [ ] Deleted files removed from bucket

### 10. Edge Cases

#### Multiple Uploads
- [ ] Upload 3-5 documents simultaneously
- [ ] Process multiple documents at once
- [ ] Verify no conflicts or race conditions

#### Large Files
- [ ] Upload 8-9MB PDF
- [ ] Verify processing completes
- [ ] Check chunk count is reasonable

#### Special Characters
- [ ] Upload file with special chars in name
- [ ] Upload file with unicode in content
- [ ] Verify no encoding issues

#### Network Issues
- [ ] Start upload, interrupt network → Verify error handling
- [ ] Process document with slow connection → Verify timeout handling

## Production Readiness

- [ ] All tests passing
- [ ] Error messages user-friendly
- [ ] Loading states appropriate
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Mobile responsive
- [ ] Accessibility checked (keyboard navigation)

## Performance Checks

- [ ] Upload speed acceptable (<5s for 5MB file)
- [ ] Processing time reasonable (<30s for average document)
- [ ] UI remains responsive during processing
- [ ] Auto-refresh doesn't cause lag
- [ ] Large document list scrolls smoothly

## Security Verification

- [ ] File type validation enforced (client and server)
- [ ] File size limits enforced
- [ ] RLS policies active on storage
- [ ] Service role key not exposed to client
- [ ] No sensitive data in error messages
- [ ] Subcategory validation prevents unauthorized access

## Cleanup

- [ ] Delete test documents
- [ ] Remove test files from Storage
- [ ] Clear any failed/stuck processing documents

## Documentation

- [ ] README updated with setup instructions
- [ ] API documentation complete
- [ ] Error codes documented
- [ ] Example requests/responses provided

## Next Steps (Optional Enhancements)

- [ ] Add batch upload functionality
- [ ] Implement progress bar for large files
- [ ] Add document preview before processing
- [ ] Enable content editing after upload
- [ ] Add duplicate detection
- [ ] Implement file versioning
- [ ] Create processing queue for large batches
- [ ] Add webhook notifications
- [ ] Implement analytics tracking

---

## Quick Start Command

```bash
# 1. Ensure dev server is running
npm run dev

# 2. Navigate to admin panel
open http://localhost:3000/admin/documents

# 3. Upload a test file
# - Select PDF/DOCX/MD file
# - Enter title
# - Choose subcategory
# - Click Upload

# 4. Process the document
# - Click "Process" button
# - Wait for completion
# - Verify in knowledge base
```

## Troubleshooting Common Issues

### Issue: Storage bucket not found
**Solution**: Run migration or manually create bucket in Supabase dashboard

### Issue: Upload fails with 500 error
**Solution**: Check SUPABASE_SERVICE_ROLE_KEY is set correctly

### Issue: Processing fails immediately
**Solution**: Verify OPENAI_API_KEY is valid and has quota

### Issue: Embeddings not generated
**Solution**: Check document_chunks table structure and OpenAI API billing

### Issue: File not parsing correctly
**Solution**: Verify file is valid PDF/DOCX/MD and not corrupted

---

**Date Completed**: 2025-11-25
**System Status**: All 6 files created and documented
