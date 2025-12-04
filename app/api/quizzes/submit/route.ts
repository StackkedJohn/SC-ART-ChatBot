import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { quizId, userName, userEmail, answers, startedAt, completedAt } = body;

    if (!quizId || !userName || !answers || !startedAt || !completedAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch quiz and questions
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizError) throw quizError;

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId);

    if (questionsError) throw questionsError;

    // Calculate score
    let score = 0;
    let totalPoints = 0;

    questions.forEach((question) => {
      totalPoints += question.points;
      const userAnswer = answers[question.id];

      if (!userAnswer) return;

      // Scoring logic
      if (question.question_type === 'short_answer') {
        // Normalize and compare
        const normalizedUserAnswer = userAnswer.toLowerCase().trim();
        const normalizedCorrectAnswer = question.correct_answer.toLowerCase().trim();

        // Check if the answer contains the correct answer or is very similar
        if (
          normalizedUserAnswer === normalizedCorrectAnswer ||
          normalizedUserAnswer.includes(normalizedCorrectAnswer) ||
          normalizedCorrectAnswer.includes(normalizedUserAnswer)
        ) {
          score += question.points;
        }
      } else {
        // Exact match for multiple choice and true/false
        if (userAnswer === question.correct_answer) {
          score += question.points;
        }
      }
    });

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    const passed = percentage >= quiz.passing_score;

    // Calculate time taken
    const timeTakenSeconds = Math.floor(
      (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000
    );

    // Create attempt record
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        user_name: userName,
        user_email: userEmail || null,
        score,
        total_points: totalPoints,
        percentage,
        passed,
        answers,
        time_taken_seconds: timeTakenSeconds,
        started_at: startedAt,
        completed_at: completedAt,
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    // Update quiz statistics
    const { data: allAttempts, error: attemptsError } = await supabaseAdmin
      .from('quiz_attempts')
      .select('percentage')
      .eq('quiz_id', quizId);

    if (!attemptsError && allAttempts) {
      const averageScore = allAttempts.reduce((sum, a) => sum + a.percentage, 0) / allAttempts.length;

      await supabaseAdmin
        .from('quizzes')
        .update({
          total_attempts: allAttempts.length,
          average_score: averageScore,
        })
        .eq('id', quizId);
    }

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      totalPoints,
      percentage,
      passed,
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}
