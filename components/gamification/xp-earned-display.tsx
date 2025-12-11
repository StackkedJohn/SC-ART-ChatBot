import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, Star, Award } from 'lucide-react';

interface XPEarnedDisplayProps {
  xpEarned: number;
  xpBreakdown: string[];
  speedBonusPercent?: number;
  perfectStreakMultiplier?: number;
}

export function XPEarnedDisplay({
  xpEarned,
  xpBreakdown,
  speedBonusPercent,
  perfectStreakMultiplier,
}: XPEarnedDisplayProps) {
  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            XP Earned
          </CardTitle>
          <Badge variant="outline" className="text-lg px-3 py-1 bg-blue-50 dark:bg-blue-950">
            +{xpEarned} XP
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* XP Breakdown */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Breakdown:</p>
          <div className="space-y-1 text-sm">
            {xpBreakdown.map((item, index) => (
              <div key={index} className="flex items-start gap-2 text-muted-foreground">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bonus Highlights */}
        <div className="flex flex-wrap gap-2 pt-2">
          {speedBonusPercent && speedBonusPercent > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {speedBonusPercent}% Speed Bonus
            </Badge>
          )}
          {perfectStreakMultiplier && perfectStreakMultiplier > 1.0 && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-purple-100 dark:bg-purple-950">
              <Star className="h-3 w-3 text-purple-600" />
              {perfectStreakMultiplier.toFixed(1)}x Perfect Streak
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
