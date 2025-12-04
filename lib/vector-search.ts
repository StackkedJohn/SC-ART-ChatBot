import { generateEmbedding } from './openai';
import { supabaseAdmin } from './supabase';

export interface SearchResult {
  content_item_id: string;
  chunk_text: string;
  similarity: number;
  title: string;
  category_name: string;
  subcategory_name: string;
}

/**
 * Perform semantic search using vector similarity
 */
export async function semanticSearch(
  query: string,
  limit: number = 10,
  categoryId?: string
): Promise<SearchResult[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Perform vector similarity search
    // Format embedding as vector string for Postgres
    const vectorString = `[${queryEmbedding.join(',')}]`;

    let rpcQuery = supabaseAdmin.rpc('search_document_chunks', {
      query_embedding: vectorString,
      match_threshold: 0.3,
      match_count: limit,
    });

    const { data, error } = await rpcQuery;

    if (error) {
      // If the RPC function doesn't exist, fall back to direct query
      return await directVectorSearch(queryEmbedding, limit, categoryId);
    }

    return data || [];
  } catch (error) {
    console.error('Error performing semantic search:', error);
    throw error;
  }
}

/**
 * Direct vector search fallback (if RPC function not available)
 */
async function directVectorSearch(
  queryEmbedding: number[],
  limit: number,
  categoryId?: string
): Promise<SearchResult[]> {
  try {
    // Build the query
    const { data: chunks, error } = await supabaseAdmin
      .from('document_chunks')
      .select(
        `
        content_item_id,
        chunk_text,
        embedding,
        metadata,
        content_items!inner (
          title,
          subcategories!inner (
            name,
            categories!inner (
              name
            )
          )
        )
      `
      )
      .limit(limit * 2); // Get more results to calculate similarity

    if (error) {
      throw error;
    }

    if (!chunks || chunks.length === 0) {
      return [];
    }

    // Calculate cosine similarity for each chunk
    const results = chunks
      .map((chunk: any) => {
        const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);

        return {
          content_item_id: chunk.content_item_id,
          chunk_text: chunk.chunk_text,
          similarity,
          title: chunk.content_items.title,
          category_name: chunk.content_items.subcategories.categories.name,
          subcategory_name: chunk.content_items.subcategories.name,
        };
      })
      .filter((result) => result.similarity > 0.3) // Threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error('Error in direct vector search:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Build context string from search results
 */
export function buildContextFromChunks(results: SearchResult[]): string {
  return results
    .map((result) => {
      return `Source: ${result.category_name} > ${result.subcategory_name} > ${result.title}\n${result.chunk_text}`;
    })
    .join('\n\n---\n\n');
}
