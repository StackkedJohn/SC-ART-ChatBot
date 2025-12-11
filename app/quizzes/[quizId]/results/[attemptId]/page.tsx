'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Quiz, QuizAttempt, QuizQuestion } from '@/lib/supabase';
import { QuizResults } from '@/components/quiz/quiz-results';
import { LEVELS } from '@/lib/gamification/level-calculator';
import { Loader2 } from 'lucide-react';

interface GamificationData {
  xpEarned?: number;
  xpBreakdown?: string[];
  leveledUp?: boolean;
  newLevel?: number;
  previousLevel?: number;
  perfectStreakMultiplier?: number;
}

export default function QuizResultsPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const attemptId = params.attemptId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [quizId, attemptId]);

  const fetchData = async () => {
    try {
      // Retrieve gamification data from session storage
      const gamificationDataStr = sessionStorage.getItem('quiz_gamification_data');
      if (gamificationDataStr) {
        try {
          const data = JSON.parse(gamificationDataStr);
          setGamificationData(data);
          // Clear it after reading
          sessionStorage.removeItem('quiz_gamification_data');
        } catch (e) {
          console.error('Error parsing gamification data:', e);
        }
      }

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

  // Get level names if level-up occurred
  const previousLevelName = gamificationData?.previousLevel
    ? LEVELS.find((l) => l.level === gamificationData.previousLevel)?.name
    : undefined;
  const newLevelName = gamificationData?.newLevel
    ? LEVELS.find((l) => l.level === gamificationData.newLevel)?.name
    : undefined;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <QuizResults
        quiz={quiz}
        attempt={attempt}
        questions={questions}
        xpEarned={gamificationData?.xpEarned}
        xpBreakdown={gamificationData?.xpBreakdown}
        leveledUp={gamificationData?.leveledUp}
        newLevel={gamificationData?.newLevel}
        newLevelName={newLevelName}
        previousLevel={gamificationData?.previousLevel}
        previousLevelName={previousLevelName}
      />
    </div>
  );
}
