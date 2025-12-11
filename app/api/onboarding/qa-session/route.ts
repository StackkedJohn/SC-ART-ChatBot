import { NextRequest, NextResponse } from 'next/server';
import { getManagerQASession, updateManagerQASession } from '@/lib/onboarding';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const internId = searchParams.get('internId');

    if (!internId) {
      return NextResponse.json({ error: 'Intern ID is required' }, { status: 400 });
    }

    const session = await getManagerQASession(internId);
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching Q&A session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Q&A session' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, ...updates } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const session = await updateManagerQASession(sessionId, updates);
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating Q&A session:', error);
    return NextResponse.json(
      { error: 'Failed to update Q&A session' },
      { status: 500 }
    );
  }
}
