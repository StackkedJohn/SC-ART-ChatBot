import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateQuizQuestions } from '@/lib/anthropic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contentIds, questionCount, questionTypes, subcategoryId } = body;

    if (!contentIds || contentIds.length === 0) {
      return NextResponse.json({ error: 'Content IDs are required' }, { status: 400 });
    }

    // Fetch content items
    const { data: contentItems, error: contentError } = await supabaseAdmin
      .from('content_items')
      .select('id, title, content')
      .in('id', contentIds);

    if (contentError) throw contentError;

    if (!contentItems || contentItems.length === 0) {
      return NextResponse.json({ error: 'No content found' }, { status: 404 });
    }

    // Combine content
    const combinedContent = contentItems
      .map((item) => `## ${item.title}\n\n${item.content}`)
      .join('\n\n---\n\n');

    // Generate questions using AI
    const generated = await generateQuizQuestions(
      combinedContent,
      questionCount || 10,
      questionTypes || ['multiple_choice', 'true_false']
    );

    // Create quiz
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        title: generated.title || 'AI Generated Quiz',
        description: `Generated from ${contentItems.length} content items`,
        subcategory_id: subcategoryId || null,
        passing_score: 70,
        is_published: false,
        total_attempts: 0,
      })
      .select()
      .single();

    if (quizError) throw quizError;

    // Insert questions
    const questionsToInsert = generated.questions.map((q: any, index: number) => ({
      quiz_id: quiz.id,
      question_text: q.questionText,
      question_type: q.questionType,
      correct_answer: q.correctAnswer,
      options: q.options || null,
      explanation: q.explanation || null,
      points: 1,
      sort_order: index,
    }));

    const { error: questionsError } = await supabaseAdmin
      .from('quiz_questions')
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

    // Fetch complete quiz
    const { data: questions } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('sort_order', { ascending: true });

    return NextResponse.json({
      quiz,
      questions: questions || [],
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
