'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';

interface ChecklistProgressProps {
  progress: number;
  completedItems: number;
  totalItems: number;
}

export function ChecklistProgress({
  progress,
  completedItems,
  totalItems,
}: ChecklistProgressProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="font-semibold">Overall Progress</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {completedItems} of {totalItems} completed
          </span>
        </div>
        <Progress value={progress} className="h-3" />
        <p className="text-sm text-muted-foreground mt-2">
          {progress === 100
            ? '🎉 Onboarding complete! Welcome to the team!'
            : `${Math.round(progress)}% complete - keep going!`}
        </p>
      </CardContent>
    </Card>
  );
}
