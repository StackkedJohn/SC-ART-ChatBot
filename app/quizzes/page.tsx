'use client';

import { useEffect, useState } from 'react';
import { Quiz } from '@/lib/supabase';
import { QuizCard } from '@/components/quiz/quiz-card';
import { Loader2, BookOpen, Palette, GraduationCap, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes?published=true');
      if (!response.ok) throw new Error('Failed to fetch quizzes');
      const data = await response.json();
      setQuizzes(data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Organize quizzes by category
  const artistQuizzes = quizzes.filter(q => q.quiz_category === 'artist_standard');
  const internQuizzes = quizzes.filter(q => q.quiz_category === 'intern_standard');
  const customQuizzes = quizzes.filter(q => q.quiz_category === 'custom');

  // Group artist quizzes by target role
  const artistQuizzesByRole = artistQuizzes.reduce((acc, quiz) => {
    const role = quiz.target_role || 'General';
    if (!acc[role]) acc[role] = [];
    acc[role].push(quiz);
    return acc;
  }, {} as Record<string, Quiz[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Knowledge Quizzes</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Test your knowledge and track your progress
        </p>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No quizzes available yet</h3>
          <p className="text-muted-foreground">
            Check back soon for new quizzes
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Section 1: Artist Standard Tests */}
          {artistQuizzes.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b pb-3">
                <Palette className="h-6 w-6 text-brand-sc-pink" />
                <h2 className="text-3xl font-bold">Artist Standard Tests</h2>
              </div>
              <p className="text-muted-foreground">
                Required tests for artists at each level or job description
              </p>

              {Object.entries(artistQuizzesByRole).map(([role, roleQuizzes]) => (
                <div key={role} className="space-y-4">
                  <h3 className="text-xl font-semibold text-brand-sc-pink flex items-center gap-2">
                    <span className="w-2 h-2 bg-brand-sc-pink rounded-full"></span>
                    {role}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roleQuizzes.map((quiz) => (
                      <QuizCard
                        key={quiz.id}
                        quiz={quiz}
                        href={`/quizzes/${quiz.id}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Section 2: Intern Standard Tests */}
          {internQuizzes.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b pb-3">
                <GraduationCap className="h-6 w-6 text-brand-barely-butter" />
                <h2 className="text-3xl font-bold">Intern Standard Tests</h2>
              </div>
              <p className="text-muted-foreground">
                Required tests for all interns during onboarding and training
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {internQuizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    href={`/quizzes/${quiz.id}`}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Custom/Random Tests */}
          {customQuizzes.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b pb-3">
                <Sparkles className="h-6 w-6 text-brand-cream-slush" />
                <h2 className="text-3xl font-bold">Additional Tests</h2>
              </div>
              <p className="text-muted-foreground">
                Custom and supplementary tests for continued learning
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customQuizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    href={`/quizzes/${quiz.id}`}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
