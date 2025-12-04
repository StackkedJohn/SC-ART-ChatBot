'use client';

import { Quiz } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, FileText, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

interface QuizCardProps {
  quiz: Quiz;
  href: string;
  action?: React.ReactNode;
}

export function QuizCard({ quiz, href, action }: QuizCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-xl">{quiz.title}</CardTitle>
            {quiz.description && (
              <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
            )}
          </div>
          {!quiz.is_published && (
            <Badge variant="secondary" className="ml-2">
              Draft
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {quiz.time_limit_minutes && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{quiz.time_limit_minutes} min</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>{quiz.passing_score}% to pass</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{quiz.total_attempts} attempts</span>
          </div>
          {quiz.average_score !== null && quiz.average_score !== undefined && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Avg: {Math.round(quiz.average_score)}%</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="flex-1">
            <Link href={href}>View Quiz</Link>
          </Button>
          {action}
        </div>
      </CardContent>
    </Card>
  );
}
