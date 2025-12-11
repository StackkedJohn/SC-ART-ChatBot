'use client';

import { useEffect, useState } from 'react';
import { XPProgressRing } from '@/components/gamification/xp-progress-ring';
import { StatsCard } from '@/components/gamification/stats-card';
import { StreakIndicator } from '@/components/gamification/streak-indicator';
import { Award, Target, TrendingUp, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface UserStats {
  totalXP: number;
  currentLevel: number;
  levelName: string;
  levelProgress: number;
  xpForNextLevel: number | null;
  totalQuizzesCompleted: number;
  totalQuizzesPassed: number;
  perfectScoresCount: number;
  accuracyRate: number;
  currentStreakDays: number;
  longestStreakDays: number;
  perfectStreakCount: number;
  perfectStreakMultiplier: number;
  lastActivityDate: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/gamification/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your stats. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load stats. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Your Dashboard</h1>
        <p className="text-muted-foreground">
          Track your progress and see how you're mastering the Art department knowledge base
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - XP Progress Ring */}
        <div className="lg:col-span-1">
          <XPProgressRing
            currentXP={stats.totalXP}
            currentLevel={stats.currentLevel}
            levelName={stats.levelName}
            progressPercent={stats.levelProgress}
            xpForNextLevel={stats.xpForNextLevel}
          />
        </div>

        {/* Right Column - Stats & Streaks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatsCard
              title="Quizzes Completed"
              value={stats.totalQuizzesCompleted}
              icon={Target}
              description={`${stats.totalQuizzesPassed} passed`}
              iconColor="text-blue-600"
            />
            <StatsCard
              title="Perfect Scores"
              value={stats.perfectScoresCount}
              icon={Award}
              description={`${((stats.perfectScoresCount / Math.max(stats.totalQuizzesCompleted, 1)) * 100).toFixed(0)}% of quizzes`}
              iconColor="text-yellow-600"
            />
            <StatsCard
              title="Accuracy Rate"
              value={`${stats.accuracyRate.toFixed(1)}%`}
              icon={TrendingUp}
              description="Overall pass rate"
              iconColor="text-green-600"
            />
            <StatsCard
              title="Perfect Streak Multiplier"
              value={`${stats.perfectStreakMultiplier.toFixed(1)}x`}
              icon={Zap}
              description={`${stats.perfectStreakCount} consecutive perfect scores`}
              iconColor="text-purple-600"
            />
          </div>

          {/* Streak Indicators */}
          <div className="space-y-4">
            <StreakIndicator
              currentStreak={stats.currentStreakDays}
              longestStreak={stats.longestStreakDays}
              type="daily"
            />
            <StreakIndicator
              currentStreak={stats.perfectStreakCount}
              longestStreak={stats.longestStreakDays}
              type="perfect"
              perfectStreakMultiplier={stats.perfectStreakMultiplier}
            />
          </div>
        </div>
      </div>

      {/* Activity Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        Last activity: {new Date(stats.lastActivityDate).toLocaleDateString()}
      </div>
    </div>
  );
}
