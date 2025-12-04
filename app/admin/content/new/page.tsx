'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContentForm } from '@/components/admin/content-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ContentFormData {
  title: string;
  content: string;
  subcategory_id: string;
  is_active: boolean;
  sort_order: number;
}

export default function NewContentPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(data: ContentFormData) {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create content');
      }

      toast({
        title: 'Success',
        description: 'Content created successfully.',
      });

      // Redirect to edit page to allow embedding generation
      router.push(`/admin/content/${result.contentItem.id}/edit`);
      router.refresh();
    } catch (error: any) {
      console.error('Error creating content:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    router.push('/admin/content');
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/content">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Content
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Content</h1>
        <p className="text-muted-foreground">Add new content with markdown formatting support.</p>
      </div>

      <div className="max-w-4xl">
        <ContentForm onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
