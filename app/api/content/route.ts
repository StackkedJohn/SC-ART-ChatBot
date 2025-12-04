import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subcategoryId = searchParams.get('subcategory_id');
    const categoryId = searchParams.get('category_id');
    const isActive = searchParams.get('is_active');

    let query = supabaseAdmin
      .from('content_items')
      .select(`
        *,
        subcategories (
          id,
          name,
          categories (
            id,
            name,
            icon
          )
        )
      `)
      .order('sort_order', { ascending: true });

    if (subcategoryId) {
      query = query.eq('subcategory_id', subcategoryId);
    }

    if (categoryId) {
      query = query.eq('subcategories.category_id', categoryId);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: contentItems, error } = await query;

    if (error) {
      console.error('Error fetching content items:', error);
      return NextResponse.json({ error: 'Failed to fetch content items' }, { status: 500 });
    }

    return NextResponse.json({ contentItems });
  } catch (error) {
    console.error('Unexpected error fetching content items:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
      .insert({
        title: title.trim(),
        content: content.trim(),
        subcategory_id,
        is_active: is_active ?? true,
        sort_order,
      })
      .select(`
        *,
        subcategories (
          id,
          name,
          categories (
            id,
            name,
            icon
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error creating content item:', error);
      return NextResponse.json({ error: 'Failed to create content item' }, { status: 500 });
    }

    return NextResponse.json({ contentItem }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating content item:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
