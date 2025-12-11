import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request, context: { params: Promise<{ quizId: string }> }) {
  try {
    const { quizId } = await context.params;

    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizError) throw quizError;

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('sort_order', { ascending: true });

    if (questionsError) throw questionsError;

    return NextResponse.json({
      quiz,
      questions: questions || [],
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ quizId: string }> }) {
  try {
    const { quizId } = await context.params;
    const body = await request.json();
    const { quiz, questions } = body;

    // Update quiz metadata
    if (quiz) {
      const { error: quizError } = await supabaseAdmin
        .from('quizzes')
        .update({
          title: quiz.title,
          description: quiz.description,
          subcategory_id: quiz.subcategory_id || null,
          time_limit_minutes: quiz.time_limit_minutes || null,
          passing_score: quiz.passing_score,
          is_published: quiz.is_published,
          quiz_category: quiz.quiz_category || 'custom',
          target_role: quiz.target_role || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quizId);

      if (quizError) throw quizError;
    }

    // Update questions
    if (questions) {
      // Delete existing questions
      const { error: deleteError } = await supabaseAdmin
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', quizId);

      if (deleteError) throw deleteError;

      // Insert new questions
      if (questions.length > 0) {
        const questionsToInsert = questions.map((q: any, index: number) => ({
          quiz_id: quizId,
          question_text: q.question_text,
          question_type: q.question_type,
          correct_answer: q.correct_answer,
          options: q.options || null,
          explanation: q.explanation || null,
          points: q.points || 1,
          sort_order: index,
        }));

        const { error: insertError } = await supabaseAdmin
          .from('quiz_questions')
          .insert(questionsToInsert);

        if (insertError) throw insertError;
      }
    }

    // Fetch updated quiz
    const { data: updatedQuiz, error: fetchError } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (fetchError) throw fetchError;

    const { data: updatedQuestions } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('sort_order', { ascending: true });

    return NextResponse.json({
      quiz: updatedQuiz,
      questions: updatedQuestions || [],
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ quizId: string }> }) {
  try {
    const { quizId } = await context.params;

    // Delete questions first (foreign key constraint)
    const { error: questionsError } = await supabaseAdmin
      .from('quiz_questions')
      .delete()
      .eq('quiz_id', quizId);

    if (questionsError) throw questionsError;

    // Delete quiz attempts
    const { error: attemptsError } = await supabaseAdmin
      .from('quiz_attempts')
      .delete()
      .eq('quiz_id', quizId);

    if (attemptsError) throw attemptsError;

    // Delete quiz
    const { error: quizError } = await supabaseAdmin.from('quizzes').delete().eq('id', quizId);

    if (quizError) throw quizError;

    return NextResponse.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 });
  }
}
