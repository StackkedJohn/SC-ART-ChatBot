import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Generate a chat response using Claude
 */
export async function generateChatResponse(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    const textContent = response.content.find((block) => block.type === 'text');
    return textContent ? (textContent as any).text : '';
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error('Failed to generate chat response');
  }
}

/**
 * Generate a streaming chat response using Claude
 */
export async function* streamChatResponse(
  systemPrompt: string,
  messages: ChatMessage[]
): AsyncGenerator<string> {
  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  } catch (error) {
    console.error('Error streaming chat response:', error);
    throw new Error('Failed to stream chat response');
  }
}

/**
 * Generate quiz questions from content using Claude
 */
export async function generateQuizQuestions(
  content: string,
  questionCount: number,
  questionTypes: string[]
): Promise<any> {
  const prompt = `Based on the following content, generate ${questionCount} quiz questions.

REQUIREMENTS:
1. Questions should test practical knowledge that employees need
2. Mix difficulty levels (some easy recall, some application)
3. Multiple choice questions should have 4 options with only one correct answer
4. True/False questions should be clearly true or false, not ambiguous
5. Short answer questions should have a specific expected answer
6. Include an explanation for each question that teaches why the answer is correct

QUESTION TYPES TO GENERATE:
${questionTypes.join(', ')}

OUTPUT FORMAT (JSON):
{
  "title": "Suggested quiz title",
  "questions": [
    {
      "questionText": "The question",
      "questionType": "multiple_choice",
      "correctAnswer": "The correct answer",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "explanation": "Why this is the correct answer and what to remember"
    }
  ]
}

CONTENT TO BASE QUESTIONS ON:
${content}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    const text = textContent ? (textContent as any).text : '';

    // Extract JSON from response (Claude might wrap it in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to parse quiz questions from response');
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    throw new Error('Failed to generate quiz questions');
  }
}
