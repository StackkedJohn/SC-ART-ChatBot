import { NextRequest, NextResponse } from 'next/server';
import { updateChecklistItem, archiveChecklistItem } from '@/lib/onboarding';

export async function PUT(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const { itemId } = params;
    const body = await req.json();

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const item = await updateChecklistItem(itemId, body);
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating checklist item:', error);
    return NextResponse.json(
      { error: 'Failed to update checklist item' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const { itemId } = params;
    const body = await req.json();

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const item = await updateChecklistItem(itemId, body);
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating checklist item:', error);
    return NextResponse.json(
      { error: 'Failed to update checklist item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const { itemId } = params;

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    await archiveChecklistItem(itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting checklist item:', error);
    return NextResponse.json(
      { error: 'Failed to delete checklist item' },
      { status: 500 }
    );
  }
}
