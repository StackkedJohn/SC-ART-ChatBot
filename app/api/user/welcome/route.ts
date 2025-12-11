import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mark user as having seen welcome
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({ has_seen_welcome: true })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating has_seen_welcome:', error);
      return NextResponse.json(
        { error: 'Failed to update welcome status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in welcome route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
