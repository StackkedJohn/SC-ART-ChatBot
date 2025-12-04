'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Subcategory, Category } from '@/lib/supabase';
import { Loader2, Plus, Pencil, Trash2, Filter } from 'lucide-react';

type SubcategoryWithCategory = Subcategory & {
  categories?: Category;
};

export default function SubcategoriesPage() {
  const [subcategories, setSubcategories] = useState<SubcategoryWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  useEffect(() => {
    fetchSubcategories();
  }, [filterCategoryId]);

  async function fetchCategories() {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function fetchSubcategories() {
    setLoading(true);
    try {
      const url = filterCategoryId === 'all'
        ? '/api/subcategories'
        : `/api/subcategories?category_id=${filterCategoryId}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subcategories');
      }

      setSubcategories(data.subcategories || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subcategories. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(subcategoryId: string, subcategoryName: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${subcategoryName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(subcategoryId);

    try {
      const response = await fetch(`/api/subcategories/${subcategoryId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete subcategory');
      }

      toast({
        title: 'Success',
        description: 'Subcategory deleted successfully.',
      });

      await fetchSubcategories();
    } catch (error: any) {
      console.error('Error deleting subcategory:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete subcategory. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  }

  if (loading && subcategories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subcategories</h1>
          <p className="text-muted-foreground">Manage subcategories within each category.</p>
        </div>
        <Button asChild>
          <Link href="/admin/subcategories/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Subcategory
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {subcategories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {filterCategoryId === 'all'
                ? 'No subcategories yet.'
                : 'No subcategories in this category.'}
            </p>
            <Button asChild>
              <Link href="/admin/subcategories/new">
                <Plus className="mr-2 h-4 w-4" />
                Create your first subcategory
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subcategories.map((subcategory) => (
            <Card key={subcategory.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{subcategory.categories?.icon}</span>
                      <span className="text-sm text-muted-foreground">
                        {subcategory.categories?.name}
                      </span>
                    </div>
                    <CardTitle>{subcategory.name}</CardTitle>
                    {subcategory.description && (
                      <CardDescription className="mt-1">{subcategory.description}</CardDescription>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">Sort Order: {subcategory.sort_order}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                      disabled={deletingId === subcategory.id}
                    >
                      <Link href={`/admin/subcategories/${subcategory.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(subcategory.id, subcategory.name)}
                      disabled={deletingId === subcategory.id}
                    >
                      {deletingId === subcategory.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
