import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface ActivityItem {
  query: string;
  count: number;
  lastUsed: string;
  isUserQuery: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Get user's recent searches (if authenticated)
    let recentSearches: ActivityItem[] = [];
    if (user) {
      const { data: userSearches } = await supabaseAdmin
        .from('chat_sessions')
        .select('last_query, query_count, updated_at')
        .eq('user_id', user.id)
        .not('last_query', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(6);

      if (userSearches) {
        recentSearches = userSearches.map((s) => ({
          query: s.last_query!,
          count: s.query_count || 1,
          lastUsed: s.updated_at,
          isUserQuery: true,
        }));
      }
    }

    // Get popular queries (FAQs) from all users
    const { data: popularQueries } = await supabaseAdmin
      .from('chat_sessions')
      .select('last_query, query_count, updated_at')
      .not('last_query', 'is', null)
      .order('query_count', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(8);

    const faqs: ActivityItem[] = popularQueries
      ? popularQueries.map((q) => ({
          query: q.last_query!,
          count: q.query_count || 1,
          lastUsed: q.updated_at,
          isUserQuery: false,
        }))
      : [];

    // Combine and deduplicate (prioritize user's recent searches)
    const userQueryTexts = new Set(recentSearches.map((s) => s.query));
    const filteredFaqs = faqs.filter((faq) => !userQueryTexts.has(faq.query));

    // Mix: 6 recent searches + 6 FAQs = 12 total (or adjust as needed)
    const combined = [...recentSearches, ...filteredFaqs].slice(0, 12);

    return NextResponse.json({
      recentSearches: recentSearches.slice(0, 6),
      faqs: filteredFaqs.slice(0, 6),
      combined,
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
