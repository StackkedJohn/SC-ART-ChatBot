import { NextRequest, NextResponse } from 'next/server';
import { acceptInvitation } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { token, password, fullName } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const user = await acceptInvitation(token, password, fullName);

    return NextResponse.json({
      user,
      message: 'Account created successfully',
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 500 }
    );
  }
}
