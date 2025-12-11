import { NextRequest, NextResponse } from 'next/server';
import { getChecklistTemplates, createChecklistItem } from '@/lib/onboarding';

export async function GET(req: NextRequest) {
  try {
    const items = await getChecklistTemplates();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching checklist items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checklist items' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      item_type,
      display_order,
      is_required,
      is_active,
      config,
      created_by,
    } = body;

    if (!title || !description || !item_type) {
      return NextResponse.json(
        { error: 'Title, description, and item type are required' },
        { status: 400 }
      );
    }

    const item = await createChecklistItem({
      title,
      description,
      item_type,
      display_order: display_order || 0,
      is_required: is_required ?? true,
      is_active: is_active ?? true,
      config: config || {},
      created_by,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error creating checklist item:', error);
    return NextResponse.json(
      { error: 'Failed to create checklist item' },
      { status: 500 }
    );
  }
}
