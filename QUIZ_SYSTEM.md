# Quiz System Documentation

Complete implementation of a quiz management and taking system with AI generation capabilities.

## Overview

The Quiz System provides:
- **Admin CRUD**: Full quiz and question management
- **AI Generation**: Generate quizzes from content using Claude API
- **Quiz Taking**: Interactive quiz interface with timer
- **Results & Analytics**: Detailed results with explanations and statistics
- **Attempt Tracking**: View all attempts and performance metrics

## File Structure

### Quiz Components (5 files)
- `/components/quiz/quiz-card.tsx` - Quiz preview card with stats
- `/components/quiz/quiz-question.tsx` - Question display (multiple_choice, true_false, short_answer)
- `/components/quiz/quiz-progress.tsx` - Progress bar with optional timer
- `/components/quiz/quiz-results.tsx` - Results display with breakdown
- `/components/quiz/quiz-generator.tsx` - AI generation UI

### Admin Components (2 files)
- `/components/admin/quiz-form.tsx` - Quiz metadata form
- `/components/admin/question-form.tsx` - Individual question editor

### UI Components (3 files)
- `/components/ui/progress.tsx` - Progress bar component
- `/components/ui/checkbox.tsx` - Checkbox component
- `/components/ui/radio-group.tsx` - Radio button group

### API Routes (6 files)
- `/app/api/quizzes/route.ts` - GET all quizzes, POST create
- `/app/api/quizzes/[quizId]/route.ts` - GET, PUT, DELETE quiz
- `/app/api/quizzes/generate/route.ts` - AI quiz generation
- `/app/api/quizzes/submit/route.ts` - Submit answers and calculate score
- `/app/api/quizzes/[quizId]/attempts/route.ts` - GET all attempts
- `/app/api/quizzes/[quizId]/attempts/[attemptId]/route.ts` - GET single attempt

### Admin Pages (5 files)
- `/app/admin/quizzes/page.tsx` - List all quizzes with publish toggle
- `/app/admin/quizzes/new/page.tsx` - Create quiz manually
- `/app/admin/quizzes/[quizId]/edit/page.tsx` - Edit quiz and questions
- `/app/admin/quizzes/generate/page.tsx` - AI generation interface
- `/app/admin/quizzes/[quizId]/attempts/page.tsx` - View all attempts

### Public Pages (4 files)
- `/app/quizzes/page.tsx` - List published quizzes
- `/app/quizzes/[quizId]/page.tsx` - Quiz intro/start page
- `/app/quizzes/[quizId]/take/page.tsx` - Take quiz interface
- `/app/quizzes/[quizId]/results/[attemptId]/page.tsx` - View results

## Features

### Question Types
1. **Multiple Choice**: 2-8 options with one correct answer
2. **True/False**: Simple binary questions
3. **Short Answer**: Free text with fuzzy matching

### Quiz Settings
- Title and description
- Optional subcategory association
- Time limit (optional, in minutes)
- Passing score percentage
- Published/draft status

### AI Generation
- Select multiple content items
- Specify number of questions
- Choose question types to generate
- AI creates questions with explanations

### Quiz Taking
- Name entry before starting (no auth required)
- Optional email for tracking
- Progress indicator
- Timer countdown (if time limit set)
- Navigate between questions
- Auto-submit on time expiration
- Prevent back navigation during quiz

### Results & Analytics
- Score percentage and points
- Pass/fail status
- Time taken
- Question-by-question breakdown
- Correct answers with explanations
- Try again option if failed

### Admin Features
- Create quizzes manually or with AI
- Edit questions inline
- Publish/unpublish toggle
- View all attempts per quiz
- Statistics: total attempts, pass rate, average score

## Usage

### Creating a Quiz Manually

1. Go to `/admin/quizzes`
2. Click "Create Quiz"
3. Fill in quiz metadata (title, description, passing score, etc.)
4. Click "Create Quiz"
5. Add questions one by one
6. Click "Save All" to persist questions
7. Toggle "Published" when ready

### Generating a Quiz with AI

1. Go to `/admin/quizzes`
2. Click "AI Generate"
3. Select a subcategory
4. Choose content items to base questions on
5. Set number of questions and types
6. Click "Generate Quiz"
7. Review and edit generated questions
8. Publish when ready

### Taking a Quiz

1. Go to `/quizzes`
2. Select a quiz
3. Enter your name (and optional email)
4. Click "Start Quiz"
5. Answer questions (navigate with Previous/Next)
6. Click "Submit Quiz" when done
7. View results with explanations

### Viewing Attempts (Admin)

1. Go to `/admin/quizzes`
2. Click "Attempts" on a quiz card
3. View statistics: total attempts, pass rate, average score
4. See individual attempts with details
5. Click "View Details" to see full results

## Database Schema

The system uses the following tables from Supabase:

### quizzes
```sql
- id: uuid (primary key)
- title: text
- description: text (optional)
- subcategory_id: uuid (optional, foreign key)
- time_limit_minutes: integer (optional)
- passing_score: integer (default 70)
- is_published: boolean (default false)
- total_attempts: integer (default 0)
- average_score: numeric (optional)
- created_at: timestamp
- updated_at: timestamp
```

### quiz_questions
```sql
- id: uuid (primary key)
- quiz_id: uuid (foreign key)
- question_text: text
- question_type: enum ('multiple_choice', 'true_false', 'short_answer')
- correct_answer: text
- options: text[] (optional, for multiple_choice)
- explanation: text (optional)
- points: integer (default 1)
- sort_order: integer
- created_at: timestamp
```

### quiz_attempts
```sql
- id: uuid (primary key)
- quiz_id: uuid (foreign key)
- user_name: text
- user_email: text (optional)
- score: integer
- total_points: integer
- percentage: numeric
- passed: boolean
- answers: jsonb (question_id -> answer mapping)
- time_taken_seconds: integer (optional)
- started_at: timestamp
- completed_at: timestamp
```

## Scoring Logic

### Multiple Choice & True/False
- Exact match: Full points
- No match: 0 points

### Short Answer
- Exact match (case-insensitive): Full points
- Correct answer contained in user answer: Full points
- User answer contained in correct answer: Full points
- No match: 0 points

The fuzzy matching for short answers allows for variations in phrasing while still validating knowledge.

## API Endpoints

### GET /api/quizzes
Query params: `published=true` (optional)
Returns: Array of quizzes

### POST /api/quizzes
Body: Quiz metadata
Returns: Created quiz

### GET /api/quizzes/[quizId]
Returns: Quiz with questions

### PUT /api/quizzes/[quizId]
Body: `{ quiz?, questions? }`
Returns: Updated quiz with questions

### DELETE /api/quizzes/[quizId]
Returns: Success message

### POST /api/quizzes/generate
Body: `{ contentIds, questionCount, questionTypes, subcategoryId }`
Returns: Generated quiz with questions

### POST /api/quizzes/submit
Body: `{ quizId, userName, userEmail, answers, startedAt, completedAt }`
Returns: `{ attemptId, score, totalPoints, percentage, passed }`

### GET /api/quizzes/[quizId]/attempts
Returns: Array of attempts for quiz

### GET /api/quizzes/[quizId]/attempts/[attemptId]
Returns: Single attempt details

## Security Considerations

### Public Access
- Users can view published quizzes without authentication
- Name entry required to take quiz
- Email is optional
- Results are publicly viewable via attempt ID

### Admin Access
- Admin pages should be protected by authentication middleware (not implemented in these files)
- Use Supabase Row Level Security (RLS) policies for production
- API routes use `supabaseAdmin` for full access

### Data Protection
- Quiz answers stored in JSONB for flexibility
- No PII required except optional email
- Attempt IDs are UUIDs (not guessable)

## Performance Optimizations

### Caching
- Quiz data cached during taking (no refetch between questions)
- User info stored in sessionStorage during quiz

### Database
- Indexes on `quiz_id`, `is_published`, `completed_at`
- Efficient queries with selective fields

### UX
- Progress indicator for feedback
- Loading states for all async operations
- Optimistic UI updates where safe

## Future Enhancements

### Potential Features
- Question bank for reuse across quizzes
- Question difficulty levels
- Randomized question order
- Randomized option order
- Image/media support in questions
- Category-based question selection
- Leaderboards
- Quiz prerequisites
- Timed individual questions
- Partial credit for short answers
- Bulk quiz import/export
- Quiz templates

### Analytics Improvements
- Time spent per question
- Most missed questions
- Difficulty analysis
- User performance trends
- Question effectiveness metrics

## Troubleshooting

### Quiz won't submit
- Check all required questions are answered
- Verify network connection
- Check browser console for errors
- Ensure quiz is still published

### AI generation fails
- Verify ANTHROPIC_API_KEY is set
- Check content has sufficient text
- Ensure selected content is active
- Review API error messages

### Timer not working
- Verify time_limit_minutes is set on quiz
- Check browser supports Date.now()
- Ensure tab remains active

### Results not showing
- Verify attemptId is valid
- Check quiz hasn't been deleted
- Ensure API routes are accessible

## Testing Checklist

### Admin Functionality
- [ ] Create quiz manually
- [ ] Edit quiz metadata
- [ ] Add/edit/delete questions
- [ ] Save all questions at once
- [ ] Toggle publish status
- [ ] Delete quiz
- [ ] Generate quiz with AI
- [ ] View attempts and statistics

### Public Functionality
- [ ] View published quizzes
- [ ] Read quiz intro
- [ ] Enter name and email
- [ ] Take quiz with all question types
- [ ] Navigate between questions
- [ ] Submit incomplete quiz (confirmation)
- [ ] Submit complete quiz
- [ ] View results with explanations
- [ ] Try again after failing
- [ ] Timer countdown (if enabled)
- [ ] Auto-submit on time expiration

### Edge Cases
- [ ] Quiz with no questions
- [ ] Empty options in multiple choice
- [ ] Very long question text
- [ ] Special characters in answers
- [ ] Browser back button during quiz
- [ ] Page refresh during quiz
- [ ] Concurrent attempts

## File Locations Reference

All 25 files created in this implementation:

```
components/
├── quiz/
│   ├── quiz-card.tsx
│   ├── quiz-question.tsx
│   ├── quiz-progress.tsx
│   ├── quiz-results.tsx
│   └── quiz-generator.tsx
├── admin/
│   ├── quiz-form.tsx
│   └── question-form.tsx
└── ui/
    ├── progress.tsx
    ├── checkbox.tsx
    └── radio-group.tsx

app/
├── api/quizzes/
│   ├── route.ts
│   ├── [quizId]/
│   │   ├── route.ts
│   │   └── attempts/
│   │       ├── route.ts
│   │       └── [attemptId]/route.ts
│   ├── generate/route.ts
│   └── submit/route.ts
├── admin/quizzes/
│   ├── page.tsx
│   ├── new/page.tsx
│   ├── [quizId]/
│   │   ├── edit/page.tsx
│   │   └── attempts/page.tsx
│   └── generate/page.tsx
└── quizzes/
    ├── page.tsx
    └── [quizId]/
        ├── page.tsx
        ├── take/page.tsx
        └── results/[attemptId]/page.tsx
```

## Support

For issues or questions about the Quiz System:
1. Check this documentation
2. Review database schema in Supabase
3. Check browser console for errors
4. Verify API responses in Network tab
5. Ensure environment variables are set
