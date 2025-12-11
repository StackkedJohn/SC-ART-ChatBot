import { NextRequest, NextResponse } from 'next/server';
import { updateChecklistItemProgress } from '@/lib/onboarding';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, checklistItemId, status, progressData, internNotes } = body;

    if (!userId || !checklistItemId) {
      return NextResponse.json(
        { error: 'User ID and checklist item ID are required' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (progressData) updates.progress_data = progressData;
    if (internNotes !== undefined) updates.intern_notes = internNotes;

    const progress = await updateChecklistItemProgress(userId, checklistItemId, updates);

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
