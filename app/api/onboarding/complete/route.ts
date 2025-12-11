import { NextRequest, NextResponse } from 'next/server';
import { completeChecklistItem } from '@/lib/onboarding';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, checklistItemId, progressData } = body;

    if (!userId || !checklistItemId) {
      return NextResponse.json(
        { error: 'User ID and checklist item ID are required' },
        { status: 400 }
      );
    }

    const progress = await completeChecklistItem(userId, checklistItemId, progressData);

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error completing checklist item:', error);
    return NextResponse.json(
      { error: 'Failed to complete checklist item' },
      { status: 500 }
    );
  }
}
