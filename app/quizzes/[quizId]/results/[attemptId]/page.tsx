'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Quiz, QuizAttempt, QuizQuestion } from '@/lib/supabase';
import { QuizResults } from '@/components/quiz/quiz-results';
import { Loader2 } from 'lucide-react';

export default function QuizResultsPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const attemptId = params.attemptId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [quizId, attemptId]);

  const fetchData = async () => {
    try {
      const [quizResponse, attemptResponse] = await Promise.all([
        fetch(`/api/quizzes/${quizId}`),
        fetch(`/api/quizzes/${quizId}/attempts/${attemptId}`),
      ]);

      if (!quizResponse.ok || !attemptResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const quizData = await quizResponse.json();
      const attemptData = await attemptResponse.json();

      setQuiz(quizData.quiz);
      setQuestions(quizData.questions);
      setAttempt(attemptData);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  if (!quiz || !attempt) {
    return (
      <div className="container mx-auto py-8">
        <p>Results not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <QuizResults quiz={quiz} attempt={attempt} questions={questions} />
    </div>
  );
}
