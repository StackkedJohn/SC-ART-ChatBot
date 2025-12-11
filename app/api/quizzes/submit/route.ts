import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { calculateXP, isFirstAttempt } from '@/lib/gamification/xp-calculator';
import { checkLevelUp } from '@/lib/gamification/level-calculator';

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { quizId, answers, startedAt, completedAt } = body;

    if (!quizId || !answers || !startedAt || !completedAt) {
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

    // Check if this is first attempt at this quiz
    const firstAttempt = await isFirstAttempt(currentUser.id, quizId);

    // Get user's current stats for level-up detection
    const { data: userStatsBefore } = await supabaseAdmin
      .from('user_stats')
      .select('total_xp')
      .eq('user_id', currentUser.id)
      .single();

    const previousXP = userStatsBefore?.total_xp || 0;

    // Calculate XP earned from this quiz attempt
    const xpCalculation = await calculateXP({
      quizId,
      userId: currentUser.id,
      score,
      totalPoints,
      percentage,
      timeTaken: timeTakenSeconds,
      isFirstAttempt: firstAttempt,
    });

    // Create attempt record with gamification data
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        user_id: currentUser.id,
        user_name: currentUser.full_name || currentUser.email, // Keep for backward compat
        user_email: currentUser.email,
        score,
        total_points: totalPoints,
        percentage,
        passed,
        answers,
        time_taken_seconds: timeTakenSeconds,
        xp_earned: xpCalculation.totalXP,
        speed_bonus_percent: xpCalculation.speedBonusPercent,
        perfect_streak_multiplier: xpCalculation.perfectStreakMultiplier,
        started_at: startedAt,
        completed_at: completedAt,
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    // Check if user leveled up
    const levelUpInfo = checkLevelUp(previousXP, previousXP + xpCalculation.totalXP);

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
      // Gamification data
      xpEarned: xpCalculation.totalXP,
      xpBreakdown: xpCalculation.breakdown,
      leveledUp: levelUpInfo.leveledUp,
      newLevel: levelUpInfo.newLevel,
      previousLevel: levelUpInfo.previousLevel,
      perfectStreakMultiplier: xpCalculation.perfectStreakMultiplier,
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}
