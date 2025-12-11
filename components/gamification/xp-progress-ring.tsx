'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface XPProgressRingProps {
  currentXP: number;
  currentLevel: number;
  levelName: string;
  progressPercent: number;
  xpForNextLevel: number | null;
}

export function XPProgressRing({
  currentXP,
  currentLevel,
  levelName,
  progressPercent,
  xpForNextLevel,
}: XPProgressRingProps) {
  // Calculate stroke dash for circular progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Determine level color
  const getLevelColor = (level: number) => {
    if (level >= 8) return 'from-purple-600 to-pink-600'; // Master Artist
    if (level >= 6) return 'from-orange-600 to-red-600'; // Expert
    if (level >= 4) return 'from-blue-600 to-cyan-600'; // Intermediate
    return 'from-green-600 to-emerald-600'; // Apprentice
  };

  const isMaxLevel = xpForNextLevel === null;

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center p-6">
        {/* Circular Progress SVG */}
        <div className="relative w-48 h-48">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop
                  offset="0%"
                  className={`${getLevelColor(currentLevel).split(' ')[0].replace('from-', 'stop-')}`}
                />
                <stop
                  offset="100%"
                  className={`${getLevelColor(currentLevel).split(' ')[1].replace('to-', 'stop-')}`}
                />
              </linearGradient>
            </defs>
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${getLevelColor(currentLevel)}">
                {currentLevel}
              </div>
              <div className="text-sm text-muted-foreground">Level</div>
            </div>
          </div>
        </div>

        {/* Level name badge */}
        <Badge
          variant="outline"
          className={`mt-4 px-4 py-1 text-sm font-semibold bg-gradient-to-r ${getLevelColor(
            currentLevel
          )} text-white border-none`}
        >
          {levelName}
        </Badge>

        {/* XP stats */}
        <div className="mt-4 text-center w-full">
          <div className="text-2xl font-bold">{currentXP.toLocaleString()} XP</div>
          {!isMaxLevel && xpForNextLevel !== null && (
            <div className="text-sm text-muted-foreground mt-1">
              {xpForNextLevel.toLocaleString()} XP to next level
            </div>
          )}
          {isMaxLevel && (
            <div className="text-sm text-muted-foreground mt-1">Maximum level reached!</div>
          )}
          <div className="text-xs text-muted-foreground mt-2">
            Progress: {progressPercent.toFixed(1)}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
