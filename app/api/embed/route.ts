import { NextRequest, NextResponse } from 'next/server';
import { generateContentEmbeddings } from '@/lib/embeddings';

export async function POST(req: NextRequest) {
  try {
    const { contentItemId } = await req.json();

    if (!contentItemId) {
      return NextResponse.json({ error: 'Content item ID is required' }, { status: 400 });
    }

    const chunksCreated = await generateContentEmbeddings(contentItemId);

    return NextResponse.json({
      success: true,
      chunksCreated,
    });
  } catch (error) {
    console.error('Embedding API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating embeddings' },
      { status: 500 }
    );
  }
}
