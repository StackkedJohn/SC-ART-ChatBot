import { NextRequest, NextResponse } from 'next/server';
import { reorderChecklistItems } from '@/lib/onboarding';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    await reorderChecklistItems(items);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering checklist items:', error);
    return NextResponse.json(
      { error: 'Failed to reorder checklist items' },
      { status: 500 }
    );
  }
}
