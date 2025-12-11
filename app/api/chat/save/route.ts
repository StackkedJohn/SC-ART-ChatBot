import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Get current user (optional - works for both authenticated and anonymous)
    const user = await getCurrentUser();

    // Save or update chat session
    if (user) {
      // For authenticated users, update their chat history
      const { data: existingSession } = await supabaseAdmin
        .from('chat_sessions')
        .select('id, query_count')
        .eq('user_identifier', user.id)
        .eq('last_query', query)
        .single();

      if (existingSession) {
        // Update existing query count
        await supabaseAdmin
          .from('chat_sessions')
          .update({
            query_count: (existingSession.query_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSession.id);
      } else {
        // Insert new query
        await supabaseAdmin.from('chat_sessions').insert({
          user_identifier: user.id,
          user_id: user.id,
          last_query: query,
          query_count: 1,
          messages: [{ role: 'user', content: query, timestamp: new Date().toISOString() }],
        });
      }
    } else {
      // For anonymous users, just track the query for FAQs
      const { data: existingSession } = await supabaseAdmin
        .from('chat_sessions')
        .select('id, query_count')
        .eq('last_query', query)
        .is('user_id', null)
        .single();

      if (existingSession) {
        await supabaseAdmin
          .from('chat_sessions')
          .update({
            query_count: (existingSession.query_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSession.id);
      } else {
        await supabaseAdmin.from('chat_sessions').insert({
          last_query: query,
          query_count: 1,
          messages: [{ role: 'user', content: query, timestamp: new Date().toISOString() }],
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving chat query:', error);
    return NextResponse.json(
      { error: 'Failed to save query' },
      { status: 500 }
    );
  }
}
