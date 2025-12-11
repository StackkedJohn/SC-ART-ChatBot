'use client';

import { QuizAttempt, Quiz, QuizQuestion } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, TrendingUp, Home } from 'lucide-react';
import Link from 'next/link';
import { QuizQuestionComponent } from './quiz-question';
import { XPEarnedDisplay } from '@/components/gamification/xp-earned-display';
import { LevelUpCelebration } from '@/components/gamification/level-up-celebration';

interface QuizResultsProps {
  quiz: Quiz;
  attempt: QuizAttempt;
  questions: QuizQuestion[];
  // Gamification props
  xpEarned?: number;
  xpBreakdown?: string[];
  leveledUp?: boolean;
  newLevel?: number;
  newLevelName?: string;
  previousLevel?: number;
  previousLevelName?: string;
}

export function QuizResults({
  quiz,
  attempt,
  questions,
  xpEarned,
  xpBreakdown,
  leveledUp,
  newLevel,
  newLevelName,
  previousLevel,
  previousLevelName,
}: QuizResultsProps) {
  const correctAnswers = questions.filter((q) => attempt.answers[q.id] === q.correct_answer).length;

  return (
    <div className="space-y-6">
      {/* Level Up Celebration */}
      {leveledUp && newLevel && newLevelName && previousLevel && previousLevelName && (
        <LevelUpCelebration
          previousLevel={previousLevel}
          previousLevelName={previousLevelName}
          newLevel={newLevel}
          newLevelName={newLevelName}
        />
      )}

      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {attempt.passed ? (
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
            ) : (
              <div className="rounded-full bg-red-100 p-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-3xl">
            {attempt.passed ? 'Congratulations!' : 'Keep Practicing'}
          </CardTitle>
          <CardDescription className="text-lg">
            {attempt.passed
              ? `You passed ${quiz.title}!`
              : `You need ${quiz.passing_score}% to pass. Try again!`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Your Score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Math.round(attempt.percentage)}%</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {attempt.score} out of {attempt.total_points} points
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Correct Answers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {correctAnswers}/{questions.length}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {Math.round((correctAnswers / questions.length) * 100)}% accuracy
                </p>
              </CardContent>
            </Card>

            {attempt.time_taken_seconds && (
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Time Taken</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Math.floor(attempt.time_taken_seconds / 60)}:{(attempt.time_taken_seconds % 60)
                      .toString()
                      .padStart(2, '0')}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {quiz.time_limit_minutes ? `of ${quiz.time_limit_minutes} min` : 'Total time'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* XP Earned Display */}
          {xpEarned && xpBreakdown && xpBreakdown.length > 0 && (
            <XPEarnedDisplay
              xpEarned={xpEarned}
              xpBreakdown={xpBreakdown}
              speedBonusPercent={attempt.speed_bonus_percent}
              perfectStreakMultiplier={attempt.perfect_streak_multiplier}
            />
          )}

          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/quizzes">
                <Home className="mr-2 h-4 w-4" />
                Back to Quizzes
              </Link>
            </Button>
            {!attempt.passed && (
              <Button asChild>
                <Link href={`/quizzes/${quiz.id}`}>
                  Try Again
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Review Your Answers</h2>
        {questions.map((question, index) => (
          <QuizQuestionComponent
            key={question.id}
            question={question}
            questionNumber={index + 1}
            userAnswer={attempt.answers[question.id]}
            showCorrectAnswer={true}
            disabled={true}
          />
        ))}
      </div>
    </div>
  );
}
