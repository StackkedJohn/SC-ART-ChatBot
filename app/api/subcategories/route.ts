import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('category_id');

    let query = supabaseAdmin
      .from('subcategories')
      .select(`
        *,
        categories (
          id,
          name,
          icon
        )
      `)
      .order('sort_order', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: subcategories, error } = await query;

    if (error) {
      console.error('Error fetching subcategories:', error);
      return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
    }

    return NextResponse.json({ subcategories });
  } catch (error) {
    console.error('Unexpected error fetching subcategories:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        category_id,
        sort_order,
      })
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
      console.error('Error creating subcategory:', error);
      return NextResponse.json({ error: 'Failed to create subcategory' }, { status: 500 });
    }

    return NextResponse.json({ subcategory }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating subcategory:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
