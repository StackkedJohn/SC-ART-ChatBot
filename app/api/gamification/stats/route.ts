import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { calculateLevel } from '@/lib/gamification/level-calculator';
import { getPerfectStreakMultiplier } from '@/lib/gamification/streak-calculator';

export async function GET() {
  try {
    // Get authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user stats from database
    const { data: userStats, error: statsError } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    // If user stats don't exist yet, create initial record
    if (statsError && statsError.code === 'PGRST116') {
      const { data: newStats, error: insertError } = await supabaseAdmin
        .from('user_stats')
        .insert({
          user_id: currentUser.id,
          total_xp: 0,
          current_level: 1,
          level_name: 'Apprentice',
          total_quizzes_completed: 0,
          total_quizzes_passed: 0,
          perfect_scores_count: 0,
          current_streak_days: 0,
          longest_streak_days: 0,
          perfect_streak_count: 0,
          last_activity_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Return initial stats with level info
      const levelInfo = calculateLevel(0);
      const perfectStreakMultiplier = getPerfectStreakMultiplier(0);

      return NextResponse.json({
        totalXP: 0,
        currentLevel: 1,
        levelName: 'Apprentice',
        levelProgress: levelInfo.progressPercent,
        xpForNextLevel: levelInfo.xpForNextLevel,
        totalQuizzesCompleted: 0,
        totalQuizzesPassed: 0,
        perfectScoresCount: 0,
        currentStreakDays: 0,
        longestStreakDays: 0,
        perfectStreakCount: 0,
        perfectStreakMultiplier: 1.0,
        lastActivityDate: new Date().toISOString().split('T')[0],
      });
    }

    if (statsError) throw statsError;

    // Calculate current level information from total XP
    const levelInfo = calculateLevel(userStats.total_xp);
    const perfectStreakMultiplier = getPerfectStreakMultiplier(userStats.perfect_streak_count);

    // Calculate accuracy rate
    const accuracyRate = userStats.total_quizzes_completed > 0
      ? (userStats.total_quizzes_passed / userStats.total_quizzes_completed) * 100
      : 0;

    // Return comprehensive stats
    return NextResponse.json({
      // XP & Level
      totalXP: userStats.total_xp,
      currentLevel: levelInfo.level,
      levelName: levelInfo.levelName,
      levelProgress: levelInfo.progressPercent,
      xpForNextLevel: levelInfo.xpForNextLevel,

      // Quiz Stats
      totalQuizzesCompleted: userStats.total_quizzes_completed,
      totalQuizzesPassed: userStats.total_quizzes_passed,
      perfectScoresCount: userStats.perfect_scores_count,
      accuracyRate: Math.round(accuracyRate * 10) / 10, // Round to 1 decimal

      // Streaks
      currentStreakDays: userStats.current_streak_days,
      longestStreakDays: userStats.longest_streak_days,
      perfectStreakCount: userStats.perfect_streak_count,
      perfectStreakMultiplier,

      // Activity
      lastActivityDate: userStats.last_activity_date,
      createdAt: userStats.created_at,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 });
  }
}
