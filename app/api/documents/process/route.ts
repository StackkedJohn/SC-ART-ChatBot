import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseDocument } from '@/lib/document-parser';
import { generateContentEmbeddings } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Fetch document record
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('uploaded_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.status === 'processing') {
      return NextResponse.json({ error: 'Document is already being processed' }, { status: 409 });
    }

    if (document.status === 'completed') {
      return NextResponse.json({ error: 'Document has already been processed' }, { status: 409 });
    }

    // Validate target subcategory
    if (!document.target_subcategory_id) {
      return NextResponse.json({ error: 'Target subcategory is required' }, { status: 400 });
    }

    const { data: subcategory, error: subcategoryError } = await supabaseAdmin
      .from('subcategories')
      .select('id, name')
      .eq('id', document.target_subcategory_id)
      .single();

    if (subcategoryError || !subcategory) {
      return NextResponse.json({ error: 'Invalid target subcategory' }, { status: 400 });
    }

    // Update status to processing
    await supabaseAdmin
      .from('uploaded_documents')
      .update({ status: 'processing', error_message: null })
      .eq('id', documentId);

    try {
      // Download file from storage
      const filename = document.file_url?.split('/').pop();
      if (!filename) {
        throw new Error('Invalid file URL');
      }

      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('documents')
        .download(filename);

      if (downloadError || !fileData) {
        throw new Error('Failed to download file from storage');
      }

      // Convert blob to buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Parse document based on file type
      const content = await parseDocument(buffer, document.file_type);

      if (!content || content.trim().length === 0) {
        throw new Error('No content extracted from document');
      }

      // Get title from metadata or use filename
      const title = document.metadata?.title || document.filename.replace(/\.[^/.]+$/, '');

      // Create content item
      const { data: contentItem, error: contentError } = await supabaseAdmin
        .from('content_items')
        .insert({
          subcategory_id: document.target_subcategory_id,
          title: title,
          content: content,
          is_active: true,
          sort_order: 0,
        })
        .select()
        .single();

      if (contentError || !contentItem) {
        throw new Error('Failed to create content item');
      }

      // Generate embeddings
      const chunkCount = await generateContentEmbeddings(contentItem.id);

      // Update document status to completed
      await supabaseAdmin
        .from('uploaded_documents')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          metadata: {
            ...document.metadata,
            content_item_id: contentItem.id,
            chunk_count: chunkCount,
          },
        })
        .eq('id', documentId);

      return NextResponse.json({
        success: true,
        document: {
          id: documentId,
          status: 'completed',
          content_item_id: contentItem.id,
          chunk_count: chunkCount,
        },
      });
    } catch (processingError: any) {
      console.error('Processing error:', processingError);

      // Update document status to failed
      await supabaseAdmin
        .from('uploaded_documents')
        .update({
          status: 'failed',
          error_message: processingError.message || 'Unknown processing error',
          processed_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      return NextResponse.json(
        {
          error: 'Document processing failed',
          details: processingError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Process endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
