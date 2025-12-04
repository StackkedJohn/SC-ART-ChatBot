'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Quiz, QuizQuestion, Subcategory } from '@/lib/supabase';
import { QuizForm, QuizFormData } from '@/components/admin/quiz-form';
import { QuestionForm, QuestionFormData } from '@/components/admin/question-form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Loader2, Eye, Save } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [quizId]);

  const fetchData = async () => {
    try {
      const [quizResponse, subcategoriesResponse] = await Promise.all([
        fetch(`/api/quizzes/${quizId}`),
        fetch('/api/subcategories'),
      ]);

      if (!quizResponse.ok || !subcategoriesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const quizData = await quizResponse.json();
      const subcategoriesData = await subcategoriesResponse.json();

      setQuiz(quizData.quiz);
      setQuestions(
        quizData.questions.map((q: QuizQuestion) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          correct_answer: q.correct_answer,
          options: q.options,
          explanation: q.explanation,
          points: q.points,
        }))
      );
      setSubcategories(subcategoriesData.subcategories || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load quiz',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizUpdate = async (formData: QuizFormData) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz: formData }),
      });

      if (!response.ok) throw new Error('Failed to update quiz');

      const data = await response.json();
      setQuiz(data.quiz);

      toast({
        title: 'Success',
        description: 'Quiz updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update quiz',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (!quiz) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      });

      if (!response.ok) throw new Error('Failed to save questions');

      toast({
        title: 'Success',
        description: 'Questions saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save questions',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'multiple_choice',
        correct_answer: '',
        options: ['', '', '', ''],
        explanation: '',
        points: 1,
      },
    ]);
  };

  const updateQuestion = (index: number, data: QuestionFormData) => {
    const newQuestions = [...questions];
    newQuestions[index] = data;
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto py-8">
        <p>Quiz not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/quizzes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Quiz</h1>
            <p className="text-muted-foreground mt-1">{quiz.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/quizzes/${quizId}`}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Link>
          </Button>
          <Button onClick={handleSaveAll} disabled={isSaving || questions.length === 0}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save All
          </Button>
        </div>
      </div>

      <QuizForm
        quiz={quiz}
        subcategories={subcategories}
        onSubmit={handleQuizUpdate}
        onCancel={() => router.push('/admin/quizzes')}
        isSubmitting={isSaving}
      />

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Questions ({questions.length})
          </h2>
          <Button onClick={addQuestion}>
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
            <p className="text-muted-foreground mb-4">
              Add questions to your quiz
            </p>
            <Button onClick={addQuestion}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Question
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <QuestionForm
                key={index}
                question={question}
                questionNumber={index + 1}
                onSubmit={(data) => updateQuestion(index, data)}
                onDelete={() => deleteQuestion(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
