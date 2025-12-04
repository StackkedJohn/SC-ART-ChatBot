import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;

    const { data: contentItem, error } = await supabaseAdmin
      .from('content_items')
      .select(`
        *,
        subcategories (
          id,
          name,
          category_id,
          categories (
            id,
            name,
            icon
          )
        )
      `)
      .eq('id', contentId)
      .single();

    if (error) {
      console.error('Error fetching content item:', error);
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
    }

    return NextResponse.json({ contentItem });
  } catch (error) {
    console.error('Unexpected error fetching content item:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const body = await request.json();
    const { title, content, subcategory_id, is_active, sort_order } = body;

    // Validation
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!subcategory_id) {
      return NextResponse.json({ error: 'Subcategory is required' }, { status: 400 });
    }

    if (typeof sort_order !== 'number') {
      return NextResponse.json({ error: 'Sort order must be a number' }, { status: 400 });
    }

    // Verify subcategory exists
    const { data: subcategory, error: subcategoryError } = await supabaseAdmin
      .from('subcategories')
      .select('id')
      .eq('id', subcategory_id)
      .single();

    if (subcategoryError || !subcategory) {
      return NextResponse.json({ error: 'Invalid subcategory' }, { status: 400 });
    }

    const { data: contentItem, error } = await supabaseAdmin
      .from('content_items')
      .update({
        title: title.trim(),
        content: content.trim(),
        subcategory_id,
        is_active: is_active ?? true,
        sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contentId)
      .select(`
        *,
        subcategories (
          id,
          name,
          category_id,
          categories (
            id,
            name,
            icon
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error updating content item:', error);
      return NextResponse.json({ error: 'Failed to update content item' }, { status: 500 });
    }

    return NextResponse.json({ contentItem });
  } catch (error) {
    console.error('Unexpected error updating content item:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;

    // Delete associated document chunks first
    const { error: chunksError } = await supabaseAdmin
      .from('document_chunks')
      .delete()
      .eq('content_item_id', contentId);

    if (chunksError) {
      console.error('Error deleting document chunks:', chunksError);
      return NextResponse.json({ error: 'Failed to delete associated embeddings' }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from('content_items')
      .delete()
      .eq('id', contentId);

    if (error) {
      console.error('Error deleting content item:', error);
      return NextResponse.json({ error: 'Failed to delete content item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting content item:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
