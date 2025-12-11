/**
 * Level Calculation Service for SC-ART Gamification System
 *
 * Manages the level progression system from Apprentice to Master Artist.
 * Levels are calculated based on total XP earned.
 */

export interface LevelInfo {
  level: number
  levelName: string
  minXP: number
  maxXP: number
  xpForNextLevel: number | null // null if max level
  progressPercent: number
}

/**
 * Level progression system
 * Each level has a name, minimum XP requirement, and maximum XP
 */
export const LEVELS = [
  { level: 1, name: 'Apprentice', minXP: 0, maxXP: 99 },
  { level: 2, name: 'Apprentice II', minXP: 100, maxXP: 249 },
  { level: 3, name: 'Apprentice III', minXP: 250, maxXP: 499 },
  { level: 4, name: 'Intermediate', minXP: 500, maxXP: 999 },
  { level: 5, name: 'Intermediate II', minXP: 1000, maxXP: 1999 },
  { level: 6, name: 'Expert', minXP: 2000, maxXP: 3999 },
  { level: 7, name: 'Expert II', minXP: 4000, maxXP: 7999 },
  { level: 8, name: 'Master Artist', minXP: 8000, maxXP: Infinity },
] as const

/**
 * Calculate user's level and progress based on total XP
 *
 * @param totalXP - User's total XP
 * @returns Level information including progress to next level
 */
export function calculateLevel(totalXP: number): LevelInfo {
  // Find the current level based on XP
  let currentLevelData: typeof LEVELS[number] = LEVELS[0] // Default to level 1

  for (const levelData of LEVELS) {
    if (totalXP >= levelData.minXP && totalXP <= levelData.maxXP) {
      currentLevelData = levelData
      break
    }
  }

  const { level, name: levelName, minXP, maxXP } = currentLevelData

  // Calculate XP needed for next level
  let xpForNextLevel: number | null = null
  let progressPercent = 0

  if (maxXP !== Infinity) {
    xpForNextLevel = maxXP + 1 - totalXP
    // Calculate progress percentage within current level
    const levelRange = maxXP - minXP + 1
    const xpIntoLevel = totalXP - minXP
    progressPercent = Math.min(100, (xpIntoLevel / levelRange) * 100)
  } else {
    // Max level reached
    progressPercent = 100
  }

  return {
    level,
    levelName,
    minXP,
    maxXP: maxXP === Infinity ? maxXP : maxXP,
    xpForNextLevel,
    progressPercent: Math.round(progressPercent * 10) / 10, // Round to 1 decimal
  }
}

/**
 * Check if user leveled up based on previous and current XP
 *
 * @param previousXP - User's XP before the quiz
 * @param currentXP - User's XP after the quiz
 * @returns True if user leveled up, along with new level info
 */
export function checkLevelUp(
  previousXP: number,
  currentXP: number
): { leveledUp: boolean; newLevel?: LevelInfo; previousLevel?: LevelInfo } {
  const previousLevel = calculateLevel(previousXP)
  const newLevel = calculateLevel(currentXP)

  const leveledUp = newLevel.level > previousLevel.level

  return {
    leveledUp,
    newLevel: leveledUp ? newLevel : undefined,
    previousLevel: leveledUp ? previousLevel : undefined,
  }
}

/**
 * Get all levels for display purposes
 *
 * @returns Array of all level definitions
 */
export function getAllLevels() {
  return LEVELS.map((level) => ({
    ...level,
    maxXP: level.maxXP === Infinity ? null : level.maxXP,
  }))
}

/**
 * Get the next level's information
 *
 * @param currentLevel - Current level number
 * @returns Next level info or null if max level
 */
export function getNextLevelInfo(currentLevel: number) {
  if (currentLevel >= LEVELS.length) {
    return null // Max level
  }

  const nextLevelData = LEVELS[currentLevel] // 0-indexed, so current level = index of next
  if (!nextLevelData) {
    return null
  }

  return {
    level: nextLevelData.level,
    levelName: nextLevelData.name,
    minXP: nextLevelData.minXP,
  }
}
