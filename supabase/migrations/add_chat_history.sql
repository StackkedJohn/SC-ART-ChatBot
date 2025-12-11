-- Add user_id and last_query to chat_sessions for tracking user searches
-- This enables personalized recent activity and FAQ tracking

ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS last_query text,
ADD COLUMN IF NOT EXISTS query_count int DEFAULT 1;

-- Create index for faster user search queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);

-- Create view for popular queries (FAQs)
CREATE OR REPLACE VIEW popular_queries AS
SELECT
  last_query,
  COUNT(*) as query_count,
  MAX(updated_at) as last_used
FROM chat_sessions
WHERE last_query IS NOT NULL
GROUP BY last_query
ORDER BY query_count DESC, last_used DESC;
