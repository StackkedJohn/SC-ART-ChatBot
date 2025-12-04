'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubcategoryForm } from '@/components/admin/subcategory-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SubcategoryFormData {
  name: string;
  description: string;
  category_id: string;
  sort_order: number;
}

export default function NewSubcategoryPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(data: SubcategoryFormData) {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/subcategories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create subcategory');
      }

      toast({
        title: 'Success',
        description: 'Subcategory created successfully.',
      });

      router.push('/admin/subcategories');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating subcategory:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create subcategory. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    router.push('/admin/subcategories');
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/subcategories">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Subcategories
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Subcategory</h1>
        <p className="text-muted-foreground">Add a new subcategory to organize content within a category.</p>
      </div>

      <div className="max-w-2xl">
        <SubcategoryForm onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
