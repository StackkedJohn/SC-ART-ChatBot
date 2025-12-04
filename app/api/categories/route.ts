import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        subcategories (
          id,
          name,
          description,
          sort_order,
          category_id
        )
      `)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Sort subcategories within each category
    const categoriesWithSortedSubs = categories?.map(category => ({
      ...category,
      subcategories: category.subcategories?.sort((a: any, b: any) => a.sort_order - b.sort_order) || []
    })) || [];

    return NextResponse.json({ categories: categoriesWithSortedSubs });
  } catch (error) {
    console.error('Unexpected error fetching categories:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, icon, sort_order } = body;

    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!icon || icon.trim() === '') {
      return NextResponse.json({ error: 'Icon is required' }, { status: 400 });
    }

    if (typeof sort_order !== 'number') {
      return NextResponse.json({ error: 'Sort order must be a number' }, { status: 400 });
    }

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon.trim(),
        sort_order,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating category:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
