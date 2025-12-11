# Recent Activity & FAQ Feature

## Overview
The Chat home page now displays a mix of:
- User's recent searches (if authenticated)
- Frequently asked questions from all users
- Fallback suggested questions for new users

This creates a personalized experience while showing popular topics across the knowledge base.

## Implementation Summary

### Database Changes
**File:** `supabase/migrations/add_chat_history.sql`

Added to `chat_sessions` table:
- `user_id` - Links searches to authenticated users
- `last_query` - Stores the most recent query text
- `query_count` - Tracks how many times a query has been asked

Created indexes for performance:
- `idx_chat_sessions_user_id` - Fast user lookups
- `idx_chat_sessions_updated_at` - Sorted by recency

### API Endpoints

**1. Save Chat Query** - `app/api/chat/save/route.ts`
- Saves user queries to database
- Tracks query frequency
- Works for both authenticated and anonymous users
- Non-blocking (fire-and-forget to avoid slowing chat)

**2. Get Activity** - `app/api/chat/activity/route.ts`
- Returns user's recent searches (6 items)
- Returns popular FAQs (6 items)
- Deduplicates to avoid showing same query twice
- Total of 12 items displayed

### Components

**1. RecentActivity** - `components/chat/recent-activity.tsx`
- Displays two cards:
  - "Your Recent Searches" (with clock icon)
  - "Frequently Asked Questions" (with trending icon)
- Shows query count for FAQs ("Asked X times")
- Gracefully handles loading state
- Falls back to message if no activity exists

**2. SuggestedQuestions** - `components/chat/suggested-questions.tsx`
- Now includes `<RecentActivity />` component
- Renamed hardcoded questions to "Getting Started"
- Always shows both dynamic activity and fallback questions

### Integration

**ChatInterface** - `components/chat/chat-interface.tsx`
- Saves queries to database on send (non-blocking)
- No impact on chat performance
- Errors logged but don't affect user experience

## Setup Instructions

### 1. Run Database Migration
In Supabase SQL Editor, run:
```sql
-- From supabase/migrations/add_chat_history.sql
ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS last_query text,
ADD COLUMN IF NOT EXISTS query_count int DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
```

### 2. Test the Feature
1. Navigate to http://localhost:3004/
2. If authenticated: You should see "Your Recent Searches" card (empty initially)
3. Ask some questions in chat
4. Refresh the page - your searches should appear
5. Ask the same question multiple times
6. FAQs should show popular queries with counts

### 3. Verify Database
Check that queries are being saved:
```sql
SELECT last_query, query_count, user_id, updated_at
FROM chat_sessions
WHERE last_query IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

## How It Works

### User Flow
1. User types question → Chat saves to database (async)
2. Chat processes and responds (no delay)
3. On next page load → Recent activity loads from database
4. Shows personalized recent searches + popular FAQs

### Performance Considerations
- Query saving is non-blocking (fire-and-forget)
- Activity endpoint is only called on page load (not on every chat)
- Database indexes ensure fast lookups
- Limited to 12 total items to keep UI clean

### Privacy Notes
- Anonymous users: Only queries tracked for FAQs
- Authenticated users: Queries linked to user_id for personalized history
- No message content stored (only queries)
- Follows existing application authentication patterns

## Future Enhancements (Optional)
- Clear history button
- Category-specific FAQs
- Search history search/filter
- Export chat history
- Analytics dashboard for admins
