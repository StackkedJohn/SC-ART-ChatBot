'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Subcategory, ContentItem } from '@/lib/supabase';
import { QuizGenerator, GenerateConfig } from '@/components/quiz/quiz-generator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function GenerateQuizPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  useEffect(() => {
    fetchSubcategories();
  }, []);

  useEffect(() => {
    if (selectedSubcategoryId) {
      fetchContentItems(selectedSubcategoryId);
    } else {
      setContentItems([]);
    }
  }, [selectedSubcategoryId]);

  const fetchSubcategories = async () => {
    try {
      const response = await fetch('/api/subcategories');
      if (!response.ok) throw new Error('Failed to fetch subcategories');
      const data = await response.json();
      setSubcategories(data.subcategories || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load subcategories',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContentItems = async (subcategoryId: string) => {
    setIsLoadingContent(true);
    try {
      const response = await fetch(`/api/content?subcategory_id=${subcategoryId}&is_active=true`);
      if (!response.ok) throw new Error('Failed to fetch content');
      const data = await response.json();
      setContentItems(data.contentItems || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load content items',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleGenerate = async (config: GenerateConfig) => {
    try {
      const response = await fetch('/api/quizzes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          subcategoryId: selectedSubcategoryId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate quiz');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: 'Quiz generated successfully',
      });

      router.push(`/admin/quizzes/${data.quiz.id}/edit`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate quiz',
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
    <div className="container mx-auto py-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/quizzes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">AI Quiz Generator</h1>
          <p className="text-muted-foreground mt-1">
            Generate a quiz from existing content using AI
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Subcategory</CardTitle>
          <CardDescription>
            Choose a subcategory to load content items for quiz generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Select value={selectedSubcategoryId} onValueChange={setSelectedSubcategoryId}>
              <SelectTrigger id="subcategory">
                <SelectValue placeholder="Select a subcategory" />
              </SelectTrigger>
              <SelectContent>
                {subcategories.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoadingContent ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : selectedSubcategoryId ? (
        <QuizGenerator
          onGenerate={handleGenerate}
          contentItems={contentItems.map((item) => ({
            id: item.id,
            title: item.title,
          }))}
        />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Select a subcategory to view available content
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
