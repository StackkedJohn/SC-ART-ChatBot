/**
 * Streak Calculation Service for SC-ART Gamification System
 *
 * Manages daily activity streaks and perfect score streaks.
 * Streaks encourage regular engagement and consistent learning.
 */

/**
 * Calculate updated streak based on last activity date
 *
 * @param lastActivityDate - User's last activity date (YYYY-MM-DD format or Date object)
 * @param currentActivityDate - Today's date (defaults to current date)
 * @returns Updated streak information
 */
export function calculateDailyStreak(
  lastActivityDate: string | Date | null,
  currentActivityDate: Date = new Date()
): {
  currentStreak: number
  streakBroken: boolean
  isNewStreak: boolean
} {
  // If no previous activity, this is day 1 of a new streak
  if (!lastActivityDate) {
    return {
      currentStreak: 1,
      streakBroken: false,
      isNewStreak: true,
    }
  }

  // Parse last activity date
  const lastDate = new Date(lastActivityDate)
  const today = new Date(currentActivityDate)

  // Normalize dates to midnight for comparison
  lastDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  // Calculate difference in days
  const diffTime = today.getTime() - lastDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    // Same day - no streak change
    return {
      currentStreak: 1, // Will be added to existing streak, so return 0 for no change
      streakBroken: false,
      isNewStreak: false,
    }
  } else if (diffDays === 1) {
    // Consecutive day - increment streak
    return {
      currentStreak: 1, // Will be added to existing streak
      streakBroken: false,
      isNewStreak: false,
    }
  } else {
    // More than 1 day gap - streak broken
    return {
      currentStreak: 1, // Start new streak at 1
      streakBroken: true,
      isNewStreak: true,
    }
  }
}

/**
 * Calculate updated perfect score streak
 *
 * @param currentPerfectStreak - Current perfect score streak count
 * @param wasQuizPerfect - Whether the just-completed quiz was 100%
 * @returns Updated perfect streak count
 */
export function calculatePerfectStreak(
  currentPerfectStreak: number,
  wasQuizPerfect: boolean
): number {
  if (wasQuizPerfect) {
    // Increment perfect streak
    return currentPerfectStreak + 1
  } else {
    // Streak broken - reset to 0
    return 0
  }
}

/**
 * Calculate the perfect streak multiplier based on streak count
 * Multiplier ranges from 1.0x (no streak) to 2.0x (max streak)
 * Each perfect score adds 0.1x to the multiplier
 *
 * @param perfectStreakCount - Number of consecutive perfect scores
 * @returns XP multiplier value (1.0 to 2.0)
 */
export function getPerfectStreakMultiplier(perfectStreakCount: number): number {
  // Base multiplier is 1.0, each perfect score adds 0.1, max is 2.0
  const multiplier = 1.0 + perfectStreakCount * 0.1
  return Math.min(multiplier, 2.0)
}

/**
 * Determine if user qualifies for streak bonus XP (3+ day streak)
 *
 * @param streakDays - Number of consecutive days
 * @returns True if user gets streak bonus (3+ days)
 */
export function qualifiesForStreakBonus(streakDays: number): boolean {
  return streakDays >= 3
}

/**
 * Get streak status message for display
 *
 * @param streakDays - Number of consecutive days
 * @returns Status message and emoji
 */
export function getStreakStatus(streakDays: number): {
  message: string
  emoji: string
  color: string
} {
  if (streakDays === 0) {
    return {
      message: 'Start your streak today!',
      emoji: '🎯',
      color: 'text-gray-500',
    }
  } else if (streakDays === 1) {
    return {
      message: 'Keep it going!',
      emoji: '🔥',
      color: 'text-orange-500',
    }
  } else if (streakDays < 7) {
    return {
      message: `${streakDays} day streak!`,
      emoji: '🔥',
      color: 'text-orange-600',
    }
  } else if (streakDays < 30) {
    return {
      message: `${streakDays} day streak! 🎉`,
      emoji: '🔥',
      color: 'text-red-500',
    }
  } else {
    return {
      message: `${streakDays} day streak! Amazing! 🏆`,
      emoji: '🔥',
      color: 'text-red-600',
    }
  }
}

/**
 * Get perfect streak status message for display
 *
 * @param perfectStreak - Number of consecutive perfect scores
 * @returns Status message with multiplier info
 */
export function getPerfectStreakStatus(perfectStreak: number): {
  message: string
  multiplier: number
  emoji: string
} {
  const multiplier = getPerfectStreakMultiplier(perfectStreak)

  if (perfectStreak === 0) {
    return {
      message: 'Get a perfect score to start your streak!',
      multiplier: 1.0,
      emoji: '⭐',
    }
  } else if (perfectStreak < 5) {
    return {
      message: `${perfectStreak}× Perfect Streak (${multiplier.toFixed(1)}x XP)`,
      multiplier,
      emoji: '⭐',
    }
  } else if (perfectStreak < 10) {
    return {
      message: `${perfectStreak}× Perfect Streak (${multiplier.toFixed(1)}x XP) 🎉`,
      multiplier,
      emoji: '⭐',
    }
  } else {
    return {
      message: `${perfectStreak}× Perfect Streak (MAX ${multiplier.toFixed(1)}x XP) 🏆`,
      multiplier,
      emoji: '⭐',
    }
  }
}
