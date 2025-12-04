'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Quiz, QuizQuestion } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, TrendingUp, FileText, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function QuizIntroPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}`);
      if (!response.ok) throw new Error('Failed to fetch quiz');
      const data = await response.json();

      if (!data.quiz.is_published) {
        router.push('/quizzes');
        return;
      }

      setQuiz(data.quiz);
      setQuestions(data.questions);
    } catch (error) {
      console.error('Error fetching quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = () => {
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }

    // Store user info in session storage
    sessionStorage.setItem('quiz_user_name', userName);
    sessionStorage.setItem('quiz_user_email', userEmail);

    router.push(`/quizzes/${quizId}/take`);
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

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="container mx-auto py-8 max-w-2xl space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/quizzes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quizzes
        </Link>
      </Button>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">{quiz.title}</CardTitle>
          {quiz.description && (
            <CardDescription className="text-base mt-2">
              {quiz.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{questions.length}</div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{totalPoints}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>

            {quiz.time_limit_minutes && (
              <div className="text-center p-4 border rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{quiz.time_limit_minutes}</div>
                <div className="text-sm text-muted-foreground">Minutes</div>
              </div>
            )}

            <div className="text-center p-4 border rounded-lg">
              <Badge variant="outline" className="mb-2">
                Passing Score
              </Badge>
              <div className="text-2xl font-bold">{quiz.passing_score}%</div>
            </div>
          </div>

          {quiz.average_score !== null && quiz.average_score !== undefined && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <Users className="h-5 w-5 inline-block mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {quiz.total_attempts} people have taken this quiz
              </span>
              <div className="text-sm font-medium mt-1">
                Average score: {Math.round(quiz.average_score)}%
              </div>
            </div>
          )}

          <div className="space-y-4 border-t pt-6">
            <div className="space-y-2">
              <Label htmlFor="userName">Your Name *</Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userEmail">Email (optional)</Label>
              <Input
                id="userEmail"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
          </div>

          <Button onClick={handleStart} className="w-full" size="lg">
            Start Quiz
          </Button>

          {quiz.time_limit_minutes && (
            <p className="text-sm text-center text-muted-foreground">
              You will have {quiz.time_limit_minutes} minutes to complete this quiz
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
