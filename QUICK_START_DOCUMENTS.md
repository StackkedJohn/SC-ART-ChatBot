# Quick Start: Document Upload System

Get the document upload system running in 5 minutes.

## Step 1: Create Storage Bucket (2 minutes)

### Option A: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Click **Storage** in left sidebar
3. Click **Create a new bucket**
4. Name it: `documents`
5. Toggle **Public bucket** ON
6. Click **Create bucket**

### Option B: Run SQL Migration
```sql
-- Copy and paste this into Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Service role has full access to documents"
ON storage.objects FOR ALL
USING (bucket_id = 'documents' AND auth.jwt()->>'role' = 'service_role');
```

## Step 2: Verify Environment Variables (1 minute)

Check `.env.local` has these variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=sk-your_openai_key
```

## Step 3: Start Development Server (1 minute)

```bash
npm run dev
```

Open browser to: **http://localhost:3000/admin/documents**

## Step 4: Upload Your First Document (1 minute)

1. **Enter Title**: "My First Document"
2. **Select Subcategory**: Choose any existing subcategory
3. **Upload File**: Drag-and-drop a PDF, DOCX, or MD file
4. **Click**: "Upload Document" button

## Step 5: Process the Document (30 seconds)

1. Wait for upload to complete (shows in list with gray "Pending" badge)
2. Click the **"Process"** button
3. Watch status change: Pending → Processing (blue) → Completed (green)
4. Processing takes 10-30 seconds depending on file size

## Done! ✅

Your document is now:
- ✅ Uploaded to Supabase Storage
- ✅ Parsed and text extracted
- ✅ Created as a content item
- ✅ Chunked into segments
- ✅ Embedded with OpenAI
- ✅ Searchable in the knowledge base

## Test the Knowledge Base

1. Navigate to the main chat interface
2. Ask a question about your uploaded document
3. The chatbot should retrieve relevant chunks and answer based on your content

## Common First-Time Issues

### Upload fails: "Invalid file type"
**Cause**: File must be PDF, DOCX, or MD
**Fix**: Use a supported file type

### Upload fails: "Failed to upload file to storage"
**Cause**: Storage bucket doesn't exist or isn't public
**Fix**: Complete Step 1 above

### Processing fails: "Failed to create content item"
**Cause**: Selected subcategory was deleted
**Fix**: Choose a different subcategory

### Processing fails: OpenAI error
**Cause**: OPENAI_API_KEY not set or invalid
**Fix**: Verify API key in `.env.local` and restart server

### No chunks generated
**Cause**: Document content is empty or couldn't be parsed
**Fix**: Verify file isn't corrupted, try a different file

## Next Steps

### Upload More Documents
- PDFs: Research papers, guides, manuals
- DOCX: Word documents, reports
- Markdown: Documentation, notes, articles

### Manage Documents
- **Filter**: Use status dropdown to filter by pending/processing/completed/failed
- **Retry**: Click "Retry" on failed documents
- **Delete**: Click trash icon to remove documents (deletes content item too)

### Monitor Processing
- The interface auto-refreshes every 3 seconds during processing
- Completed documents show chunk count
- Failed documents show error messages

### Check Content Items
1. Go to `/admin/content` or `/admin/subcategories`
2. Find your uploaded content in the target subcategory
3. Edit content if needed
4. Regenerate embeddings if content changed

## File Type Details

### PDF (.pdf)
- Best for: Published documents, reports, papers
- Extracts: All text content
- Size limit: 10MB
- Note: Image-based PDFs won't work (need OCR)

### DOCX (.docx)
- Best for: Word documents, drafts
- Extracts: Raw text (removes formatting)
- Size limit: 10MB
- Note: Tables and images not included

### Markdown (.md)
- Best for: Documentation, notes
- Extracts: Text content (preserves structure)
- Size limit: 10MB
- Note: Supports frontmatter metadata

## Troubleshooting Commands

### Check if bucket exists
```bash
# In Supabase dashboard, go to Storage and look for "documents" bucket
```

### View uploaded files
```bash
# In Supabase dashboard, Storage → documents bucket
```

### Check database records
```sql
-- See recent uploads
SELECT * FROM uploaded_documents ORDER BY created_at DESC LIMIT 10;

-- See processing status
SELECT status, COUNT(*) FROM uploaded_documents GROUP BY status;

-- See content items created from uploads
SELECT ci.* FROM content_items ci
JOIN uploaded_documents ud ON ci.id = (ud.metadata->>'content_item_id')::uuid
WHERE ud.status = 'completed';
```

## Performance Tips

### For Large Files (5-10MB)
- Upload may take 10-20 seconds
- Processing may take 30-60 seconds
- Be patient, don't refresh page

### For Many Documents
- Upload one at a time for now
- Processing multiple documents works fine
- Filter by status to manage large lists

### For Long Documents
- Expect 1 chunk per ~800 tokens (~600 words)
- 10-page document ≈ 10-15 chunks
- 100-page document ≈ 100-150 chunks

## Support

### Documentation
- Full documentation: `DOCUMENT_UPLOAD_SYSTEM.md`
- Testing checklist: `DOCUMENT_UPLOAD_CHECKLIST.md`

### File Locations
```
Components:     /components/admin/file-upload.tsx
                /components/admin/status-badge.tsx

Admin Page:     /app/admin/documents/page.tsx

API Routes:     /app/api/documents/upload/route.ts
                /app/api/documents/process/route.ts
                /app/api/documents/[documentId]/route.ts

Storage SQL:    /supabase/migrations/create_documents_storage.sql
```

### Get Help
1. Check browser console for errors (F12)
2. Check server console for backend errors
3. Review error messages in UI
4. Verify environment variables
5. Check Supabase Storage bucket exists

---

**Ready to go!** Upload your first document and watch it automatically process into your knowledge base.
