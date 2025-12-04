import { encoding_for_model } from 'tiktoken';
import { generateEmbedding, generateEmbeddings } from './openai';
import { supabaseAdmin } from './supabase';

const encoder = encoding_for_model('gpt-3.5-turbo');

/**
 * Count tokens in a text string
 */
export function countTokens(text: string): number {
  const tokens = encoder.encode(text);
  return tokens.length;
}

/**
 * Split text into chunks of approximately maxTokens size
 * Uses paragraph-based splitting to maintain context
 */
export function chunkText(text: string, maxTokens: number = 800, overlap: number = 100): string[] {
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  const chunks: string[] = [];
  let currentChunk = '';
  let currentTokens = 0;

  for (const paragraph of paragraphs) {
    const paragraphTokens = countTokens(paragraph);

    // If single paragraph exceeds maxTokens, split it by sentences
    if (paragraphTokens > maxTokens) {
      const sentences = paragraph.split(/[.!?]+/).filter((s) => s.trim().length > 0);

      for (const sentence of sentences) {
        const sentenceTokens = countTokens(sentence);

        if (currentTokens + sentenceTokens > maxTokens) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            // Add overlap from end of previous chunk
            const overlapText = getOverlapText(currentChunk, overlap);
            currentChunk = overlapText + ' ' + sentence;
            currentTokens = countTokens(currentChunk);
          } else {
            // Single sentence is too long, just add it
            chunks.push(sentence.trim());
            currentChunk = '';
            currentTokens = 0;
          }
        } else {
          currentChunk += (currentChunk ? '. ' : '') + sentence;
          currentTokens += sentenceTokens;
        }
      }
    } else {
      // Normal paragraph fits in token limit
      if (currentTokens + paragraphTokens > maxTokens) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          // Add overlap from end of previous chunk
          const overlapText = getOverlapText(currentChunk, overlap);
          currentChunk = overlapText + '\n\n' + paragraph;
          currentTokens = countTokens(currentChunk);
        } else {
          currentChunk = paragraph;
          currentTokens = paragraphTokens;
        }
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        currentTokens += paragraphTokens;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Get overlap text from the end of a chunk
 */
function getOverlapText(text: string, overlapTokens: number): string {
  const words = text.split(/\s+/);
  const overlapWords = words.slice(-Math.ceil(overlapTokens / 2)); // Rough estimate
  return overlapWords.join(' ');
}

/**
 * Generate and store embeddings for a content item
 */
export async function generateContentEmbeddings(
  contentItemId: string
): Promise<number> {
  try {
    // Fetch content item
    const { data: contentItem, error: fetchError } = await supabaseAdmin
      .from('content_items')
      .select('id, title, content, subcategory_id')
      .eq('id', contentItemId)
      .single();

    if (fetchError || !contentItem) {
      throw new Error('Content item not found');
    }

    // Delete existing chunks
    await supabaseAdmin
      .from('document_chunks')
      .delete()
      .eq('content_item_id', contentItemId);

    // Combine title and content
    const fullText = `${contentItem.title}\n\n${contentItem.content}`;

    // Chunk the text
    const chunks = chunkText(fullText, 800, 100);

    // Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(chunks);

    // Prepare chunk records
    // Format embeddings as vector strings for Postgres
    const chunkRecords = chunks.map((chunk, index) => ({
      content_item_id: contentItemId,
      chunk_text: chunk,
      chunk_index: index,
      embedding: `[${embeddings[index].join(',')}]`,
      metadata: {
        title: contentItem.title,
        subcategory_id: contentItem.subcategory_id,
      },
    }));

    // Insert chunks into database
    const { error: insertError } = await supabaseAdmin
      .from('document_chunks')
      .insert(chunkRecords);

    if (insertError) {
      throw insertError;
    }

    // Update last_embedded_at timestamp
    await supabaseAdmin
      .from('content_items')
      .update({ last_embedded_at: new Date().toISOString() })
      .eq('id', contentItemId);

    return chunks.length;
  } catch (error) {
    console.error('Error generating content embeddings:', error);
    throw error;
  }
}

/**
 * Delete all embeddings for a content item
 */
export async function deleteContentEmbeddings(contentItemId: string): Promise<void> {
  await supabaseAdmin
    .from('document_chunks')
    .delete()
    .eq('content_item_id', contentItemId);
}
