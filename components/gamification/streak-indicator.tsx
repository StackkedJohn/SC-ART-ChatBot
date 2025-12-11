import { Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak: number;
  type?: 'daily' | 'perfect';
  perfectStreakMultiplier?: number;
}

export function StreakIndicator({
  currentStreak,
  longestStreak,
  type = 'daily',
  perfectStreakMultiplier,
}: StreakIndicatorProps) {
  // Determine flame color based on streak length
  const getFlameColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600'; // Epic
    if (streak >= 14) return 'text-red-600'; // Hot
    if (streak >= 7) return 'text-orange-600'; // Warm
    if (streak >= 3) return 'text-orange-500'; // Getting started
    return 'text-gray-400'; // No streak
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Start your streak today!';
    if (streak === 1) return 'Keep it going!';
    if (streak < 7) return `${streak} day streak!`;
    if (streak < 30) return `${streak} day streak! 🎉`;
    return `${streak} day streak! Amazing! 🏆`;
  };

  const getPerfectStreakMessage = (streak: number, multiplier?: number) => {
    if (streak === 0) return 'Get a perfect score to start your streak!';
    if (multiplier) {
      if (streak >= 10) {
        return `${streak}× Perfect Streak (MAX ${multiplier.toFixed(1)}x XP) 🏆`;
      }
      if (streak >= 5) {
        return `${streak}× Perfect Streak (${multiplier.toFixed(1)}x XP) 🎉`;
      }
      return `${streak}× Perfect Streak (${multiplier.toFixed(1)}x XP)`;
    }
    return `${streak}× Perfect Streak`;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${getFlameColor(currentStreak)}`}>
              {type === 'daily' ? (
                <Flame className="h-8 w-8" />
              ) : (
                <span className="text-3xl">⭐</span>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                {type === 'daily' ? 'Daily Streak' : 'Perfect Streak'}
              </div>
              <div className="text-lg font-bold">
                {type === 'daily'
                  ? getStreakMessage(currentStreak)
                  : getPerfectStreakMessage(currentStreak, perfectStreakMultiplier)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{currentStreak}</div>
            <div className="text-xs text-muted-foreground">Current</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Personal Best</span>
            <span className="font-semibold">{longestStreak} days</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
