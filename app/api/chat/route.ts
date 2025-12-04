import { NextRequest, NextResponse } from 'next/server';
import { semanticSearch, buildContextFromChunks } from '@/lib/vector-search';
import { streamChatResponse } from '@/lib/anthropic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are a helpful AI assistant for the Art department at a screen printing company. Your role is to answer questions about department processes, procedures, and training materials.

KNOWLEDGE AREAS:
- Design templates and how to create them
- Printing techniques, especially discharge printing
- Color palettes and ink specifications
- Discharge rates for different materials
- Job roles and responsibilities (intern through senior designer)
- Onboarding and training procedures
- Standard Operating Procedures (SOPs)
- Art Request Forms (ARF) guidelines
- Quality control and CSI prevention

INSTRUCTIONS:
1. Use ONLY the provided context to answer questions
2. If the answer isn't in the context, say "I don't have information about that in my knowledge base. You may want to check with your supervisor or look in [suggest relevant area]."
3. Be specific and practical in your answers
4. Reference source documents when relevant (e.g., "According to the Discharge Printing guide...")
5. Keep answers concise but complete
6. If asked about something outside work (personal questions, general knowledge), politely redirect to work-related topics

TONE:
- Professional but friendly
- Helpful and patient
- Clear and direct`;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Perform semantic search to find relevant context
    const searchResults = await semanticSearch(message, 10);

    // Build context from search results
    const context = buildContextFromChunks(searchResults);

    // Prepare system prompt with context
    const systemPromptWithContext = `${SYSTEM_PROMPT}

CONTEXT FROM KNOWLEDGE BASE:
${context || 'No relevant information found in the knowledge base.'}`;

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const chatStream = streamChatResponse(systemPromptWithContext, [
            { role: 'user', content: message },
          ]);

          for await (const chunk of chatStream) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }

          // Send sources at the end
          const sources = searchResults.slice(0, 5).map((result) => ({
            contentItemId: result.content_item_id,
            title: result.title,
            categoryName: result.category_name,
            subcategoryName: result.subcategory_name,
            excerpt: result.chunk_text.substring(0, 200) + '...',
            similarity: Math.round(result.similarity * 100),
          }));

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ sources, done: true })}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
