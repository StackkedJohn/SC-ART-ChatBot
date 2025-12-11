'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { CheckCircle2, ExternalLink } from 'lucide-react';

interface QuizAssignmentProps {
  quizId: string | null;
  itemId: string;
  userId: string;
}

export function QuizAssignment({ quizId, itemId, userId }: QuizAssignmentProps) {
  const [quizPassed, setQuizPassed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkQuizStatus = async () => {
      if (!quizId) {
        setLoading(false);
        return;
      }

      try {
        // Check if quiz has been completed with passing score
        const response = await fetch(
          `/api/quizzes/${quizId}/attempts?userId=${userId}`
        );
        const attempts = await response.json();

        const passedAttempt = attempts.find((a: any) => a.passed);
        setQuizPassed(!!passedAttempt);

        if (passedAttempt) {
          // Auto-complete the checklist item
          await fetch('/api/onboarding/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              checklistItemId: itemId,
              progressData: { quiz_passed: true, attempt_id: passedAttempt.id },
            }),
          });
        }
      } catch (error) {
        console.error('Error checking quiz status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkQuizStatus();
  }, [quizId, itemId, userId]);

  if (!quizId) {
    return (
      <div className="text-sm text-muted-foreground">
        No quiz has been assigned yet. Please contact your manager.
      </div>
    );
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Checking quiz status...</div>;
  }

  return (
    <div className="space-y-4">
      {quizPassed ? (
        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Quiz completed successfully!
          </span>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Click the button below to take the quiz. You must achieve a passing score to
            complete this requirement.
          </p>

          <Button asChild>
            <Link href={`/quizzes/${quizId}/take`}>
              Take Quiz
              <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
