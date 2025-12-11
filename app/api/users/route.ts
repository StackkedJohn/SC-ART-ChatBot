import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, listUsers, updateUserRole, deactivateUser } from '@/lib/auth';

// GET - List all users (admin only)
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const users = await listUsers();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: 'Failed to list users' },
      { status: 500 }
    );
  }
}

// PATCH - Update user role or status (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { userId, role, deactivate } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (deactivate) {
      await deactivateUser(userId);
      return NextResponse.json({ message: 'User deactivated successfully' });
    }

    if (role) {
      if (!['admin', 'artist', 'intern'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }

      await updateUserRole(userId, role);
      return NextResponse.json({ message: 'User role updated successfully' });
    }

    return NextResponse.json(
      { error: 'No action specified' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
