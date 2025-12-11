import { NextRequest, NextResponse } from 'next/server';
import { createInvitation, getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Check if user is admin
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'artist', 'intern'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const { invitation, token } = await createInvitation(
      email,
      role,
      currentUser.id
    );

    // In production, send email with invitation link
    // For now, return the token (you'll need to build email sending)
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup?token=${token}`;

    return NextResponse.json({
      invitation,
      inviteUrl,
      message: 'Invitation created successfully',
    });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
