# Document Upload and Processing System

Complete document management system for uploading, processing, and managing knowledge base content through file uploads.

## Features

- **File Upload**: Drag-and-drop interface for PDF, DOCX, and Markdown files
- **Document Processing**: Automated text extraction, chunking, and embedding generation
- **Status Tracking**: Real-time status updates (pending → processing → completed/failed)
- **Content Management**: Create content items directly from uploaded documents
- **Error Handling**: Comprehensive error messages and retry functionality
- **Storage Management**: Automatic cleanup when documents are deleted

## File Structure

```
/Users/austinwarren/SC-ART-ChatBot/
├── app/
│   ├── admin/
│   │   └── documents/
│   │       └── page.tsx                  # Main document management interface
│   └── api/
│       └── documents/
│           ├── upload/
│           │   └── route.ts              # Upload endpoint (POST, GET)
│           ├── process/
│           │   └── route.ts              # Processing endpoint (POST)
│           └── [documentId]/
│               └── route.ts              # Document operations (GET, DELETE, PATCH)
├── components/
│   └── admin/
│       ├── file-upload.tsx               # Drag-and-drop file upload component
│       └── status-badge.tsx              # Status indicator component
├── supabase/
│   └── migrations/
│       └── create_documents_storage.sql  # Storage bucket setup
└── lib/
    ├── document-parser.ts                # PDF, DOCX, MD parsers
    ├── embeddings.ts                     # Chunking and embedding generation
    └── supabase.ts                       # Database types and clients
```

## Setup Instructions

### 1. Database Setup

The `uploaded_documents` table should already exist from your schema. Verify it has these columns:

```sql
CREATE TABLE uploaded_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  target_subcategory_id UUID REFERENCES subcategories(id),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
```

### 2. Storage Bucket Setup

Run the migration to create the storage bucket:

```bash
# Apply the migration via Supabase dashboard or CLI
supabase db push

# Or manually run the SQL from:
# supabase/migrations/create_documents_storage.sql
```

Alternatively, create the bucket manually in Supabase Dashboard:
1. Go to Storage section
2. Create new bucket named "documents"
3. Set as public
4. Apply the RLS policies from the migration file

### 3. Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
```

### 4. Dependencies

All required packages are already in package.json:
- `pdf-parse` - PDF text extraction
- `mammoth` - DOCX text extraction
- `gray-matter` - Markdown frontmatter parsing
- `@supabase/supabase-js` - Supabase client
- `openai` - Embeddings generation
- `tiktoken` - Token counting for chunking

## Usage

### Accessing the Interface

Navigate to: `http://localhost:3000/admin/documents`

### Uploading a Document

1. **Enter Content Title**: Provide a meaningful title for the content item
2. **Select Target Subcategory**: Choose where the content should be stored
3. **Upload File**: Drag-and-drop or click to select a PDF, DOCX, or MD file
4. **Click Upload**: Document is uploaded to Supabase Storage with status "pending"

### Processing a Document

1. Click the **Process** button on any pending document
2. System will:
   - Download file from storage
   - Parse based on file type (PDF/DOCX/MD)
   - Create content item in target subcategory
   - Chunk text into 800-token segments with 100-token overlap
   - Generate embeddings for each chunk
   - Store chunks in `document_chunks` table
   - Update status to "completed" or "failed"

### Document Status Flow

```
pending → processing → completed
                    ↘ failed (can retry)
```

- **Pending**: Uploaded but not yet processed
- **Processing**: Currently being parsed and embedded
- **Completed**: Successfully processed and added to knowledge base
- **Failed**: Error occurred (see error message, can retry)

### Deleting a Document

Click the **Delete** button (trash icon):
- Removes document record from database
- Deletes file from Supabase Storage
- Removes associated content item
- Deletes all embeddings/chunks

## API Endpoints

### POST /api/documents/upload

Upload a new document.

**Request**: multipart/form-data
```typescript
{
  file: File,              // PDF, DOCX, or MD file
  subcategoryId: string,   // UUID of target subcategory
  title: string            // Title for content item
}
```

**Response**:
```typescript
{
  success: true,
  document: {
    id: string,
    filename: string,
    file_type: string,
    status: 'pending',
    created_at: string
  }
}
```

### GET /api/documents/upload

Fetch all uploaded documents.

**Response**:
```typescript
{
  documents: UploadedDocument[]
}
```

### POST /api/documents/process

Process a pending document.

**Request**:
```typescript
{
  documentId: string  // UUID of document to process
}
```

**Response**:
```typescript
{
  success: true,
  document: {
    id: string,
    status: 'completed',
    content_item_id: string,
    chunk_count: number
  }
}
```

### GET /api/documents/[documentId]

Get a specific document.

**Response**:
```typescript
{
  document: UploadedDocument
}
```

### DELETE /api/documents/[documentId]

Delete a document and all associated data.

**Response**:
```typescript
{
  success: true,
  message: 'Document deleted successfully'
}
```

### PATCH /api/documents/[documentId]

Update document metadata.

**Request**:
```typescript
{
  target_subcategory_id?: string,
  title?: string
}
```

## File Type Support

### PDF (.pdf)
- Extracts all text content using `pdf-parse`
- Preserves paragraph structure
- Max size: 10MB

### DOCX (.docx)
- Extracts raw text using `mammoth`
- Removes formatting, preserves content
- Max size: 10MB

### Markdown (.md)
- Supports frontmatter metadata using `gray-matter`
- Preserves markdown formatting in content
- Max size: 10MB

## Processing Pipeline

1. **Validation**: Check file type, size, and subcategory
2. **Download**: Fetch file from Supabase Storage
3. **Parse**: Extract text based on file type
4. **Create Content**: Insert record in `content_items` table
5. **Chunk**: Split text into ~800 token segments with overlap
6. **Embed**: Generate OpenAI embeddings for each chunk
7. **Store**: Save chunks and embeddings to `document_chunks`
8. **Update**: Set status to completed with metadata

## Error Handling

### Upload Errors
- Invalid file type → 400 error
- File too large → 400 error
- Invalid subcategory → 400 error
- Storage failure → 500 error

### Processing Errors
- Document not found → 404 error
- Already processing → 409 error
- Parse failure → Status set to "failed", error message stored
- Embedding failure → Status set to "failed", error message stored

Failed documents can be retried by clicking the "Retry" button.

## Storage Configuration

### Bucket Settings
- **Name**: documents
- **Public**: Yes (files are publicly readable)
- **RLS**: Enabled with policies

### RLS Policies
- Public read access
- Authenticated users can upload
- Authenticated users can delete
- Service role has full access

## Security Considerations

1. **File Type Validation**: Both extension and MIME type checked
2. **Size Limits**: 10MB maximum per file
3. **Subcategory Validation**: Ensures target exists before upload
4. **Storage Isolation**: Files stored in dedicated bucket
5. **RLS Protection**: Row-level security on storage objects
6. **Service Role**: Admin operations use service role key

## Performance Optimizations

1. **Auto-refresh**: Documents list refreshes every 3s during processing
2. **Parallel Processing**: Each document processed independently
3. **Chunking Strategy**: 800-token chunks with 100-token overlap for context
4. **Batch Embeddings**: All chunks embedded in single API call
5. **Cleanup on Delete**: Cascading deletion of related records

## Troubleshooting

### Document stuck in "processing"
- Check server logs for errors
- Verify OpenAI API key is valid
- Ensure document content is extractable
- Try deleting and re-uploading

### Upload fails
- Verify file type is PDF, DOCX, or MD
- Check file size is under 10MB
- Ensure storage bucket exists and is public
- Verify environment variables are set

### Processing fails
- Check error message in document details
- Verify target subcategory still exists
- Ensure OpenAI API quota is available
- Check file content is valid and parseable

### Embeddings not generated
- Verify `OPENAI_API_KEY` is set
- Check OpenAI API quota and billing
- Review `generateContentEmbeddings()` function
- Check `document_chunks` table structure

## Future Enhancements

- [ ] Batch upload multiple files
- [ ] Progress indicators for large files
- [ ] Support for additional file types (TXT, HTML)
- [ ] Preview document content before processing
- [ ] Edit content after upload
- [ ] Duplicate detection
- [ ] File versioning
- [ ] Scheduled processing queue
- [ ] Webhook notifications on completion
- [ ] Analytics and usage tracking

## Related Files

- `/lib/document-parser.ts` - Document parsing logic
- `/lib/embeddings.ts` - Chunking and embedding generation
- `/lib/openai.ts` - OpenAI API integration
- `/lib/supabase.ts` - Database types and clients
