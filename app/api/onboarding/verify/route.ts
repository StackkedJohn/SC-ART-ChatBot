import { NextRequest, NextResponse } from 'next/server';
import { verifyChecklistItem } from '@/lib/onboarding';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, checklistItemId, verifiedBy, adminNotes } = body;

    if (!userId || !checklistItemId || !verifiedBy) {
      return NextResponse.json(
        { error: 'User ID, checklist item ID, and verified by are required' },
        { status: 400 }
      );
    }

    const progress = await verifyChecklistItem(
      userId,
      checklistItemId,
      verifiedBy,
      adminNotes
    );

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error verifying checklist item:', error);
    return NextResponse.json(
      { error: 'Failed to verify checklist item' },
      { status: 500 }
    );
  }
}
