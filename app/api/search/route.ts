import { NextRequest, NextResponse } from 'next/server';
import { semanticSearch } from '@/lib/vector-search';

export async function POST(req: NextRequest) {
  try {
    const { query, limit = 10, categoryId } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const results = await semanticSearch(query, limit, categoryId);

    return NextResponse.json({
      results: results.map((result) => ({
        contentItemId: result.content_item_id,
        title: result.title,
        excerpt: result.chunk_text.substring(0, 200) + '...',
        similarity: Math.round(result.similarity * 100),
        category: result.category_name,
        subcategory: result.subcategory_name,
      })),
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while searching' },
      { status: 500 }
    );
  }
}
