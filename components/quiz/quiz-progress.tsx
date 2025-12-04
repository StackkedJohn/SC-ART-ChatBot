'use client';

import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  timeLimit?: number;
  startTime: Date;
  onTimeUp?: () => void;
}

export function QuizProgress({
  currentQuestion,
  totalQuestions,
  timeLimit,
  startTime,
  onTimeUp,
}: QuizProgressProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const progress = (currentQuestion / totalQuestions) * 100;

  useEffect(() => {
    if (!timeLimit) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const remaining = timeLimit * 60 - elapsed;

      if (remaining <= 0) {
        setTimeRemaining(0);
        clearInterval(interval);
        onTimeUp?.();
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimit, startTime, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Question {currentQuestion} of {totalQuestions}
        </span>
        {timeLimit && timeRemaining !== null && (
          <div
            className={`flex items-center gap-2 ${
              timeRemaining < 60 ? 'text-red-500 font-medium' : 'text-muted-foreground'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
