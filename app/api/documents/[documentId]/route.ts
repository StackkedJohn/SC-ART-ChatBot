import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await context.params;

    const { data: document, error } = await supabaseAdmin
      .from('uploaded_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await context.params;

    // Fetch document to get file URL and associated content
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('uploaded_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete associated content item if it exists
    if (document.metadata?.content_item_id) {
      const contentItemId = document.metadata.content_item_id;

      // Delete document chunks (embeddings)
      await supabaseAdmin
        .from('document_chunks')
        .delete()
        .eq('content_item_id', contentItemId);

      // Delete content item
      await supabaseAdmin
        .from('content_items')
        .delete()
        .eq('id', contentItemId);
    }

    // Delete file from storage
    if (document.file_url) {
      const filename = document.file_url.split('/').pop();
      if (filename) {
        await supabaseAdmin.storage.from('documents').remove([filename]);
      }
    }

    // Delete document record
    const { error: deleteError } = await supabaseAdmin
      .from('uploaded_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await context.params;
    const body = await request.json();
    const { target_subcategory_id, title } = body;

    // Build update object
    const updates: any = {};

    if (target_subcategory_id !== undefined) {
      // Validate subcategory exists
      const { data: subcategory, error: subcategoryError } = await supabaseAdmin
        .from('subcategories')
        .select('id')
        .eq('id', target_subcategory_id)
        .single();

      if (subcategoryError || !subcategory) {
        return NextResponse.json({ error: 'Invalid subcategory' }, { status: 400 });
      }

      updates.target_subcategory_id = target_subcategory_id;
    }

    if (title !== undefined) {
      // Fetch current document to update metadata
      const { data: document, error: fetchError } = await supabaseAdmin
        .from('uploaded_documents')
        .select('metadata')
        .eq('id', documentId)
        .single();

      if (fetchError || !document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      updates.metadata = {
        ...document.metadata,
        title,
      };
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Update document
    const { data: updatedDocument, error: updateError } = await supabaseAdmin
      .from('uploaded_documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      document: updatedDocument,
    });
  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
