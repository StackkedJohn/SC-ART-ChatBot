/**
 * XP Calculation Service for SC-ART Gamification System
 *
 * This service calculates experience points (XP) earned from quiz attempts
 * based on multiple factors including difficulty, accuracy, speed, and streaks.
 *
 * Features:
 * - Difficulty-based base XP multipliers
 * - Perfect score bonus (100% accuracy)
 * - Speed bonuses for fast completion
 * - First attempt pass bonus
 * - Perfect Streak Multiplier (UNIQUE FEATURE #3)
 * - Daily streak bonus
 */

import { supabaseAdmin } from '@/lib/supabase'

export interface XPCalculation {
  baseXP: number
  difficultyMultiplier: number
  difficultyXP: number
  perfectScoreBonus: number
  speedBonus: number
  speedBonusPercent: number
  firstAttemptBonus: number
  perfectStreakMultiplier: number
  streakBonus: number
  totalXP: number
  breakdown: string[]
}

export interface CalculateXPParams {
  quizId: string
  userId: string
  score: number
  totalPoints: number
  percentage: number
  timeTaken: number // in seconds
  isFirstAttempt: boolean
}

/**
 * Difficulty multipliers for base XP
 */
const DIFFICULTY_MULTIPLIERS = {
  beginner: 1.0,
  intermediate: 1.5,
  advanced: 2.0,
  expert: 3.0,
} as const

/**
 * Calculate XP earned from a quiz attempt
 *
 * @param params - Quiz attempt parameters
 * @returns Detailed XP calculation breakdown
 */
export async function calculateXP(params: CalculateXPParams): Promise<XPCalculation> {
  const { quizId, userId, percentage, timeTaken, isFirstAttempt } = params

  // Fetch quiz difficulty and base XP
  const { data: quiz, error: quizError } = await supabaseAdmin
    .from('quizzes')
    .select('difficulty_level, base_xp, time_limit_minutes, passing_score')
    .eq('id', quizId)
    .single()

  if (quizError || !quiz) {
    throw new Error(`Failed to fetch quiz: ${quizError?.message}`)
  }

  // Fetch user stats for streaks
  const { data: userStats, error: statsError } = await supabaseAdmin
    .from('user_stats')
    .select('current_streak_days, perfect_streak_count')
    .eq('user_id', userId)
    .single()

  // If user stats don't exist yet, use defaults
  const currentStreakDays = userStats?.current_streak_days || 0
  const perfectStreakCount = userStats?.perfect_streak_count || 0

  // Initialize calculation
  const breakdown: string[] = []
  const baseXP = quiz.base_xp || 10
  breakdown.push(`Base XP: ${baseXP}`)

  // 1. Apply difficulty multiplier
  const difficultyLevel = (quiz.difficulty_level || 'beginner') as keyof typeof DIFFICULTY_MULTIPLIERS
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficultyLevel] || 1.0
  let totalXP = baseXP * difficultyMultiplier
  const difficultyXP = totalXP
  breakdown.push(`Difficulty (${difficultyLevel}): ${baseXP} × ${difficultyMultiplier} = ${totalXP}`)

  // 2. Perfect score bonus (100% accuracy)
  let perfectScoreBonus = 0
  if (percentage === 100) {
    const bonus = totalXP * 0.5 // 50% bonus
    perfectScoreBonus = bonus
    totalXP += bonus
    breakdown.push(`Perfect Score Bonus: +${Math.round(bonus)} XP (+50%)`)
  }

  // 3. Speed bonus (based on time used vs time limit)
  let speedBonus = 0
  let speedBonusPercent = 0
  if (quiz.time_limit_minutes && quiz.time_limit_minutes > 0) {
    const timeLimitSeconds = quiz.time_limit_minutes * 60
    const timeUsedPercent = (timeTaken / timeLimitSeconds) * 100

    if (timeUsedPercent < 50) {
      // Completed in less than 50% of time: +30% XP
      const bonus = totalXP * 0.3
      speedBonus = bonus
      speedBonusPercent = 30
      totalXP += bonus
      breakdown.push(`Speed Bonus (<50% time): +${Math.round(bonus)} XP (+30%)`)
    } else if (timeUsedPercent < 75) {
      // Completed in 50-75% of time: +15% XP
      const bonus = totalXP * 0.15
      speedBonus = bonus
      speedBonusPercent = 15
      totalXP += bonus
      breakdown.push(`Speed Bonus (<75% time): +${Math.round(bonus)} XP (+15%)`)
    }
  }

  // 4. First attempt pass bonus
  let firstAttemptBonus = 0
  if (isFirstAttempt && percentage >= (quiz.passing_score || 70)) {
    const bonus = totalXP * 0.25 // 25% bonus
    firstAttemptBonus = bonus
    totalXP += bonus
    breakdown.push(`First Attempt Pass Bonus: +${Math.round(bonus)} XP (+25%)`)
  }

  // 5. PERFECT STREAK MULTIPLIER (UNIQUE FEATURE #3)
  // Consecutive perfect scores build a multiplier up to 2.0x
  const perfectStreakMultiplier = Math.min(1 + (perfectStreakCount * 0.1), 2.0)
  if (perfectStreakMultiplier > 1.0) {
    const beforeStreakMultiplier = totalXP
    totalXP *= perfectStreakMultiplier
    const streakBonus = totalXP - beforeStreakMultiplier
    breakdown.push(
      `🔥 Perfect Streak Multiplier (${perfectStreakCount} streak): ${beforeStreakMultiplier.toFixed(0)} × ${perfectStreakMultiplier.toFixed(1)} = +${Math.round(streakBonus)} XP`
    )
  }

  // 6. Daily streak bonus (3+ days)
  let streakBonus = 0
  if (currentStreakDays >= 3) {
    const bonus = totalXP * 0.1 // 10% bonus
    streakBonus = bonus
    totalXP += bonus
    breakdown.push(`Daily Streak Bonus (${currentStreakDays} days): +${Math.round(bonus)} XP (+10%)`)
  }

  // Round to nearest integer
  totalXP = Math.round(totalXP)

  return {
    baseXP,
    difficultyMultiplier,
    difficultyXP,
    perfectScoreBonus,
    speedBonus,
    speedBonusPercent,
    firstAttemptBonus,
    perfectStreakMultiplier,
    streakBonus,
    totalXP,
    breakdown,
  }
}

/**
 * Get user's quiz attempt history to determine if this is their first attempt
 *
 * @param userId - User ID
 * @param quizId - Quiz ID
 * @returns True if this is the user's first attempt at this quiz
 */
export async function isFirstAttempt(userId: string, quizId: string): Promise<boolean> {
  const { data: attempts, error } = await supabaseAdmin
    .from('quiz_attempts')
    .select('id')
    .eq('user_id', userId)
    .eq('quiz_id', quizId)
    .limit(1)

  if (error) {
    console.error('Error checking first attempt:', error)
    return false
  }

  return !attempts || attempts.length === 0
}
