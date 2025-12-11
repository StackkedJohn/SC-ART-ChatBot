-- Add quiz categorization fields
-- This allows organizing quizzes into three sections:
-- 1. Standard tests for artists (by level/job description)
-- 2. Standard tests for interns
-- 3. Random/custom tests

-- Add quiz_category enum type
DO $$ BEGIN
  CREATE TYPE quiz_category AS ENUM ('artist_standard', 'intern_standard', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add columns to quizzes table
ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS quiz_category quiz_category DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS target_role TEXT;

-- Add index for better performance when filtering by category
CREATE INDEX IF NOT EXISTS idx_quizzes_category ON quizzes(quiz_category);

-- Add comments for documentation
COMMENT ON COLUMN quizzes.quiz_category IS 'Category of quiz: artist_standard (for artists by level), intern_standard (for interns), or custom (random/custom tests)';
COMMENT ON COLUMN quizzes.target_role IS 'Target role/level for artist_standard quizzes (e.g., "Junior Artist", "Senior Artist", "Lead Artist")';
