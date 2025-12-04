'use client';

import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Subcategory, Category } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface SubcategoryFormData {
  name: string;
  description: string;
  category_id: string;
  sort_order: number;
}

interface SubcategoryFormProps {
  subcategory?: Subcategory & { categories?: Category };
  onSubmit: (data: SubcategoryFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function SubcategoryForm({ subcategory, onSubmit, onCancel, isSubmitting = false }: SubcategoryFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SubcategoryFormData>({
    defaultValues: {
      name: subcategory?.name || '',
      description: subcategory?.description || '',
      category_id: subcategory?.category_id || '',
      sort_order: subcategory?.sort_order || 0,
    },
  });

  const selectedCategoryId = watch('category_id');

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{subcategory ? 'Edit Subcategory' : 'Create New Subcategory'}</CardTitle>
        <CardDescription>
          {subcategory
            ? 'Update the subcategory information below.'
            : 'Add a new subcategory to organize content within a category.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category_id">
              Category <span className="text-red-500">*</span>
            </Label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 p-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading categories...</span>
              </div>
            ) : (
              <Select
                value={selectedCategoryId}
                onValueChange={(value) => setValue('category_id', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.category_id && <p className="text-sm text-red-500">Category is required</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="e.g., Personal Protective Equipment"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of this subcategory..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort_order">
              Sort Order <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sort_order"
              type="number"
              {...register('sort_order', {
                required: 'Sort order is required',
                valueAsNumber: true,
              })}
              placeholder="0"
              disabled={isSubmitting}
            />
            {errors.sort_order && <p className="text-sm text-red-500">{errors.sort_order.message}</p>}
            <p className="text-sm text-muted-foreground">
              Lower numbers appear first in the list
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : subcategory ? (
                'Update Subcategory'
              ) : (
                'Create Subcategory'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
