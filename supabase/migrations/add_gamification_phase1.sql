-- =====================================================
-- SC-ART Gamification System - Phase 1: MVP Foundation
-- =====================================================
-- This migration adds the core gamification tables and
-- modifications needed for XP/Leveling system with
-- Perfect Streak Multiplier feature.
--
-- Created: 2025-12-10
-- Phase: 1 (MVP Foundation)
-- =====================================================

-- 1. Create user_stats table for gamification tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
  current_level INTEGER DEFAULT 1 CHECK (current_level >= 1),
  level_name TEXT DEFAULT 'Apprentice',
  total_quizzes_completed INTEGER DEFAULT 0 CHECK (total_quizzes_completed >= 0),
  total_quizzes_passed INTEGER DEFAULT 0 CHECK (total_quizzes_passed >= 0),
  perfect_scores_count INTEGER DEFAULT 0 CHECK (perfect_scores_count >= 0),
  current_streak_days INTEGER DEFAULT 0 CHECK (current_streak_days >= 0),
  longest_streak_days INTEGER DEFAULT 0 CHECK (longest_streak_days >= 0),

  -- Perfect Streak Multiplier (UNIQUE FEATURE #3)
  perfect_streak_count INTEGER DEFAULT 0 CHECK (perfect_streak_count >= 0),

  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick user stats lookup
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_xp ON user_stats(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_last_activity ON user_stats(last_activity_date);

-- Row Level Security for user_stats
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Users can read their own stats
CREATE POLICY "Users can read own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own stats (will be done via triggers mostly)
CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert new user stats
CREATE POLICY "System can insert user stats"
  ON user_stats FOR INSERT
  WITH CHECK (true);

-- Admins can read all stats
CREATE POLICY "Admins can read all stats"
  ON user_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Modify quiz_attempts table to include user_id and gamification data
-- ========================================================================
-- Add user_id foreign key to link quiz attempts to authenticated users
ALTER TABLE quiz_attempts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);

-- Add gamification tracking columns
ALTER TABLE quiz_attempts
  ADD COLUMN IF NOT EXISTS xp_earned INTEGER DEFAULT 0 CHECK (xp_earned >= 0);

ALTER TABLE quiz_attempts
  ADD COLUMN IF NOT EXISTS speed_bonus_percent DECIMAL(5,2) DEFAULT 0 CHECK (speed_bonus_percent >= 0);

ALTER TABLE quiz_attempts
  ADD COLUMN IF NOT EXISTS perfect_streak_multiplier DECIMAL(3,2) DEFAULT 1.0 CHECK (perfect_streak_multiplier >= 1.0);

-- 3. Modify quizzes table to include difficulty and base XP
-- ==========================================================
ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'beginner'
  CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert'));

ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS base_xp INTEGER DEFAULT 10 CHECK (base_xp > 0);

-- Create index for difficulty filtering
CREATE INDEX IF NOT EXISTS idx_quizzes_difficulty ON quizzes(difficulty_level);

-- 4. Function to calculate level from XP
-- ======================================
CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp INTEGER)
RETURNS TABLE(level INTEGER, level_name TEXT, xp_for_next_level INTEGER) AS $$
BEGIN
  -- Level progression system
  RETURN QUERY
  SELECT
    CASE
      WHEN xp >= 8000 THEN 8
      WHEN xp >= 4000 THEN 7
      WHEN xp >= 2000 THEN 6
      WHEN xp >= 1000 THEN 5
      WHEN xp >= 500 THEN 4
      WHEN xp >= 250 THEN 3
      WHEN xp >= 100 THEN 2
      ELSE 1
    END AS level,
    CASE
      WHEN xp >= 8000 THEN 'Master Artist'
      WHEN xp >= 4000 THEN 'Expert II'
      WHEN xp >= 2000 THEN 'Expert'
      WHEN xp >= 1000 THEN 'Intermediate II'
      WHEN xp >= 500 THEN 'Intermediate'
      WHEN xp >= 250 THEN 'Apprentice III'
      WHEN xp >= 100 THEN 'Apprentice II'
      ELSE 'Apprentice'
    END AS level_name,
    CASE
      WHEN xp >= 8000 THEN NULL -- Max level
      WHEN xp >= 4000 THEN 8000 - xp
      WHEN xp >= 2000 THEN 4000 - xp
      WHEN xp >= 1000 THEN 2000 - xp
      WHEN xp >= 500 THEN 1000 - xp
      WHEN xp >= 250 THEN 500 - xp
      WHEN xp >= 100 THEN 250 - xp
      ELSE 100 - xp
    END AS xp_for_next_level;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Function to update user stats automatically
-- ===============================================
CREATE OR REPLACE FUNCTION update_user_stats_on_quiz_attempt()
RETURNS TRIGGER AS $$
DECLARE
  v_user_stats user_stats%ROWTYPE;
  v_level_info RECORD;
  v_previous_perfect_streak INTEGER;
BEGIN
  -- Skip if no user_id (for backward compatibility with old attempts)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get current user stats (or create if doesn't exist)
  SELECT * INTO v_user_stats FROM user_stats WHERE user_id = NEW.user_id;

  -- If user_stats doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO user_stats (
      user_id,
      total_xp,
      total_quizzes_completed,
      total_quizzes_passed,
      perfect_scores_count,
      perfect_streak_count,
      last_activity_date
    ) VALUES (
      NEW.user_id,
      COALESCE(NEW.xp_earned, 0),
      1,
      CASE WHEN NEW.passed THEN 1 ELSE 0 END,
      CASE WHEN NEW.percentage = 100 THEN 1 ELSE 0 END,
      CASE WHEN NEW.percentage = 100 THEN 1 ELSE 0 END,
      CURRENT_DATE
    );

    -- Get the newly created stats
    SELECT * INTO v_user_stats FROM user_stats WHERE user_id = NEW.user_id;
  ELSE
    -- Store previous perfect streak for comparison
    v_previous_perfect_streak := v_user_stats.perfect_streak_count;

    -- Update existing stats
    UPDATE user_stats SET
      total_xp = total_xp + COALESCE(NEW.xp_earned, 0),
      total_quizzes_completed = total_quizzes_completed + 1,
      total_quizzes_passed = total_quizzes_passed + CASE WHEN NEW.passed THEN 1 ELSE 0 END,
      perfect_scores_count = perfect_scores_count + CASE WHEN NEW.percentage = 100 THEN 1 ELSE 0 END,

      -- Perfect Streak Multiplier logic
      perfect_streak_count = CASE
        WHEN NEW.percentage = 100 THEN v_user_stats.perfect_streak_count + 1
        ELSE 0 -- Reset streak if not perfect
      END,

      last_activity_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  -- Calculate and update level based on new XP total
  SELECT * INTO v_level_info FROM calculate_level_from_xp(
    (SELECT total_xp FROM user_stats WHERE user_id = NEW.user_id)
  );

  UPDATE user_stats SET
    current_level = v_level_info.level,
    level_name = v_level_info.level_name
  WHERE user_id = NEW.user_id;

  -- Update streak tracking (daily streak)
  UPDATE user_stats SET
    current_streak_days = CASE
      WHEN last_activity_date = CURRENT_DATE THEN current_streak_days
      WHEN last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak_days + 1
      ELSE 1 -- Reset if more than 1 day gap
    END,
    longest_streak_days = GREATEST(
      longest_streak_days,
      CASE
        WHEN last_activity_date = CURRENT_DATE THEN current_streak_days
        WHEN last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak_days + 1
        ELSE 1
      END
    )
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update user stats
DROP TRIGGER IF EXISTS trigger_update_user_stats ON quiz_attempts;
CREATE TRIGGER trigger_update_user_stats
  AFTER INSERT ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_quiz_attempt();

-- 6. Initialize user_stats for existing users
-- ============================================
-- Create initial stats for any existing users who have taken quizzes
INSERT INTO user_stats (
  user_id,
  total_xp,
  total_quizzes_completed,
  total_quizzes_passed,
  perfect_scores_count,
  last_activity_date,
  created_at
)
SELECT DISTINCT
  id,  -- Fixed: user_profiles.id is the primary key column
  0 AS total_xp, -- Will be calculated retroactively if needed
  0 AS total_quizzes_completed,
  0 AS total_quizzes_passed,
  0 AS perfect_scores_count,
  CURRENT_DATE AS last_activity_date,
  NOW() AS created_at
FROM user_profiles
ON CONFLICT (user_id) DO NOTHING;

-- 7. Add comments for documentation
-- ==================================
COMMENT ON TABLE user_stats IS 'Tracks gamification statistics for each user including XP, levels, streaks, and achievements';
COMMENT ON COLUMN user_stats.perfect_streak_count IS 'Number of consecutive perfect scores (100%) - used for Perfect Streak Multiplier feature';
COMMENT ON COLUMN quiz_attempts.xp_earned IS 'Experience points earned from this quiz attempt';
COMMENT ON COLUMN quiz_attempts.perfect_streak_multiplier IS 'Multiplier applied to XP based on perfect streak (1.0 to 2.0)';
COMMENT ON COLUMN quizzes.difficulty_level IS 'Quiz difficulty: beginner (1x), intermediate (1.5x), advanced (2x), expert (3x) XP multiplier';
COMMENT ON COLUMN quizzes.base_xp IS 'Base XP value for this quiz before multipliers applied';

-- =====================================================
-- Migration Complete: Phase 1 (MVP Foundation)
-- =====================================================
-- Next steps:
-- 1. Implement XP calculation service in application code
-- 2. Update quiz submission API to calculate and award XP
-- 3. Build user dashboard UI components
-- 4. Create user stats API endpoint
-- =====================================================
