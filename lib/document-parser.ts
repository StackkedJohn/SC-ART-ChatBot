import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import matter from 'gray-matter';

/**
 * Parse PDF file and extract text
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Parse DOCX file and extract text
 */
export async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

/**
 * Parse Markdown file (with frontmatter support)
 */
export function parseMarkdown(text: string): { content: string; metadata?: any } {
  try {
    const { content, data } = matter(text);
    return {
      content,
      metadata: data,
    };
  } catch (error) {
    console.error('Error parsing Markdown:', error);
    // If frontmatter parsing fails, just return the raw text
    return {
      content: text,
      metadata: {},
    };
  }
}

/**
 * Parse document based on file type
 */
export async function parseDocument(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return parsePDF(buffer);
    case 'docx':
      return parseDOCX(buffer);
    case 'md':
    case 'markdown':
      const text = buffer.toString('utf-8');
      const { content } = parseMarkdown(text);
      return content;
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
