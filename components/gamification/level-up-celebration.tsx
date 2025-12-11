'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, ArrowUp } from 'lucide-react';
import { LevelBadge } from './level-badge';

interface LevelUpCelebrationProps {
  previousLevel: number;
  previousLevelName: string;
  newLevel: number;
  newLevelName: string;
}

export function LevelUpCelebration({
  previousLevel,
  previousLevelName,
  newLevel,
  newLevelName,
}: LevelUpCelebrationProps) {
  return (
    <Card className="border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Trophy Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-4">
              <Trophy className="h-12 w-12 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          {/* Celebration Text */}
          <div>
            <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              Level Up! 🎉
            </h3>
            <p className="text-purple-700 dark:text-purple-300 mt-1">
              You've reached a new level!
            </p>
          </div>

          {/* Level Transition */}
          <div className="flex items-center justify-center gap-4 py-4">
            <LevelBadge level={previousLevel} levelName={previousLevelName} size="lg" />
            <ArrowUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <LevelBadge level={newLevel} levelName={newLevelName} size="lg" />
          </div>

          {/* Encouragement */}
          <p className="text-sm text-muted-foreground italic">
            Keep learning and growing your expertise!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
