import { NextRequest, NextResponse } from 'next/server';
import { initializeInternOnboarding } from '@/lib/onboarding';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const count = await initializeInternOnboarding(userId);
    return NextResponse.json({ success: true, itemsCreated: count });
  } catch (error) {
    console.error('Error initializing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to initialize onboarding' },
      { status: 500 }
    );
  }
}
