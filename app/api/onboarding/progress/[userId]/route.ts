import { NextRequest, NextResponse } from 'next/server';
import { getInternOnboardingProgress } from '@/lib/onboarding';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const progress = await getInternOnboardingProgress(userId);

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching onboarding progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding progress' },
      { status: 500 }
    );
  }
}
