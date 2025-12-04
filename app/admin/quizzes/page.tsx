'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Quiz } from '@/lib/supabase';
import { QuizCard } from '@/components/quiz/quiz-card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes');
      if (!response.ok) throw new Error('Failed to fetch quizzes');
      const data = await response.json();
      setQuizzes(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load quizzes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePublished = async (quizId: string, currentStatus: boolean) => {
    setUpdatingId(quizId);
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz: { is_published: !currentStatus },
        }),
      });

      if (!response.ok) throw new Error('Failed to update quiz');

      setQuizzes((prev) =>
        prev.map((quiz) =>
          quiz.id === quizId ? { ...quiz, is_published: !currentStatus } : quiz
        )
      );

      toast({
        title: 'Success',
        description: `Quiz ${!currentStatus ? 'published' : 'unpublished'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update quiz',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete quiz');

      setQuizzes((prev) => prev.filter((quiz) => quiz.id !== quizId));

      toast({
        title: 'Success',
        description: 'Quiz deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete quiz',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quiz Management</h1>
          <p className="text-muted-foreground mt-1">
            Create, edit, and manage quizzes
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/quizzes/generate">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Generate
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/quizzes/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Quiz
            </Link>
          </Button>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No quizzes yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first quiz to get started
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild variant="outline">
              <Link href="/admin/quizzes/generate">
                <Sparkles className="mr-2 h-4 w-4" />
                AI Generate
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/quizzes/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Quiz
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="relative">
              <QuizCard
                quiz={quiz}
                href={`/admin/quizzes/${quiz.id}/edit`}
                action={
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/admin/quizzes/${quiz.id}/attempts`}>
                        Attempts
                      </Link>
                    </Button>
                  </div>
                }
              />
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/95 backdrop-blur rounded-lg p-2 shadow-sm">
                <span className="text-xs text-muted-foreground">
                  {quiz.is_published ? 'Published' : 'Draft'}
                </span>
                <Switch
                  checked={quiz.is_published}
                  onCheckedChange={() => togglePublished(quiz.id, quiz.is_published)}
                  disabled={updatingId === quiz.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
