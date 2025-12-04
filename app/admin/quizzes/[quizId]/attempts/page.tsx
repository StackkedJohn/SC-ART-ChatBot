'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Quiz, QuizAttempt } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function QuizAttemptsPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [quizId]);

  const fetchData = async () => {
    try {
      const [quizResponse, attemptsResponse] = await Promise.all([
        fetch(`/api/quizzes/${quizId}`),
        fetch(`/api/quizzes/${quizId}/attempts`),
      ]);

      if (!quizResponse.ok) throw new Error('Failed to fetch quiz');

      const quizData = await quizResponse.json();
      setQuiz(quizData.quiz);

      if (attemptsResponse.ok) {
        const attemptsData = await attemptsResponse.json();
        setAttempts(attemptsData);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto py-8">
        <p>Quiz not found</p>
      </div>
    );
  }

  const passedCount = attempts.filter((a) => a.passed).length;
  const avgScore = attempts.length > 0
    ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length
    : 0;

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/quizzes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground mt-1">Quiz Attempts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{attempts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pass Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {attempts.length > 0
                ? Math.round((passedCount / attempts.length) * 100)
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {passedCount} of {attempts.length} passed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(avgScore)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Attempts</CardTitle>
          <CardDescription>
            View all quiz attempts and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attempts yet
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">{attempt.user_name}</div>
                      {attempt.passed ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Passed
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </div>
                    {attempt.user_email && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {attempt.user_email}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(attempt.completed_at), 'PPpp')}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold">
                        {Math.round(attempt.percentage)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {attempt.score}/{attempt.total_points} pts
                      </div>
                    </div>

                    {attempt.time_taken_seconds && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {Math.floor(attempt.time_taken_seconds / 60)}:
                          {(attempt.time_taken_seconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    )}

                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/quizzes/${quizId}/results/${attempt.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
