import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subcategoryId: string }> }
) {
  try {
    const { subcategoryId } = await params;

    const { data: subcategory, error } = await supabaseAdmin
      .from('subcategories')
      .select(`
        *,
        categories (
          id,
          name,
          icon
        )
      `)
      .eq('id', subcategoryId)
      .single();

    if (error) {
      console.error('Error fetching subcategory:', error);
      return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
    }

    return NextResponse.json({ subcategory });
  } catch (error) {
    console.error('Unexpected error fetching subcategory:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ subcategoryId: string }> }
) {
  try {
    const { subcategoryId } = await params;
    const body = await request.json();
    const { name, description, category_id, sort_order } = body;

    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!category_id) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    if (typeof sort_order !== 'number') {
      return NextResponse.json({ error: 'Sort order must be a number' }, { status: 400 });
    }

    // Verify category exists
    const { data: category, error: categoryError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .single();

    if (categoryError || !category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const { data: subcategory, error } = await supabaseAdmin
      .from('subcategories')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        category_id,
        sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subcategoryId)
      .select(`
        *,
        categories (
          id,
          name,
          icon
        )
      `)
      .single();

    if (error) {
      console.error('Error updating subcategory:', error);
      return NextResponse.json({ error: 'Failed to update subcategory' }, { status: 500 });
    }

    return NextResponse.json({ subcategory });
  } catch (error) {
    console.error('Unexpected error updating subcategory:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subcategoryId: string }> }
) {
  try {
    const { subcategoryId } = await params;

    // Check if subcategory has content items
    const { data: contentItems, error: contentError } = await supabaseAdmin
      .from('content_items')
      .select('id')
      .eq('subcategory_id', subcategoryId)
      .limit(1);

    if (contentError) {
      console.error('Error checking content items:', contentError);
      return NextResponse.json({ error: 'Failed to check content items' }, { status: 500 });
    }

    if (contentItems && contentItems.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete subcategory with existing content items' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('subcategories')
      .delete()
      .eq('id', subcategoryId);

    if (error) {
      console.error('Error deleting subcategory:', error);
      return NextResponse.json({ error: 'Failed to delete subcategory' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting subcategory:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
