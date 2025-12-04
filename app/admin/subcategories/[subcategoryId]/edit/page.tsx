'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SubcategoryForm } from '@/components/admin/subcategory-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Subcategory, Category } from '@/lib/supabase';

interface SubcategoryFormData {
  name: string;
  description: string;
  category_id: string;
  sort_order: number;
}

type SubcategoryWithCategory = Subcategory & {
  categories?: Category;
};

export default function EditSubcategoryPage() {
  const [subcategory, setSubcategory] = useState<SubcategoryWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const subcategoryId = params.subcategoryId as string;

  useEffect(() => {
    if (subcategoryId) {
      fetchSubcategory();
    }
  }, [subcategoryId]);

  async function fetchSubcategory() {
    try {
      const response = await fetch(`/api/subcategories/${subcategoryId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subcategory');
      }

      setSubcategory(data.subcategory);
    } catch (error: any) {
      console.error('Error fetching subcategory:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load subcategory. Please try again.',
        variant: 'destructive',
      });
      router.push('/admin/subcategories');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(data: SubcategoryFormData) {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/subcategories/${subcategoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update subcategory');
      }

      toast({
        title: 'Success',
        description: 'Subcategory updated successfully.',
      });

      router.push('/admin/subcategories');
      router.refresh();
    } catch (error: any) {
      console.error('Error updating subcategory:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update subcategory. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    router.push('/admin/subcategories');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subcategory) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subcategory Not Found</h1>
          <p className="text-muted-foreground">The subcategory you are looking for does not exist.</p>
        </div>
        <Button asChild>
          <Link href="/admin/subcategories">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Subcategories
          </Link>
        </Button>
      </div>
    );
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
        <h1 className="text-3xl font-bold tracking-tight">Edit Subcategory</h1>
        <p className="text-muted-foreground">Update subcategory information.</p>
      </div>

      <div className="max-w-2xl">
        <SubcategoryForm
          subcategory={subcategory}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
