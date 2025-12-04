'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Category } from '@/lib/supabase';

interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CategoryForm({ category, onSubmit, onCancel, isSubmitting = false }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      icon: category?.icon || '📁',
      sort_order: category?.sort_order || 0,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{category ? 'Edit Category' : 'Create New Category'}</CardTitle>
        <CardDescription>
          {category
            ? 'Update the category information below.'
            : 'Add a new category to organize your content.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="e.g., Safety Guidelines"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of this category..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">
              Icon (Emoji) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="icon"
              {...register('icon', { required: 'Icon is required' })}
              placeholder="📁"
              maxLength={2}
              disabled={isSubmitting}
            />
            {errors.icon && <p className="text-sm text-red-500">{errors.icon.message}</p>}
            <p className="text-sm text-muted-foreground">
              Use a single emoji to represent this category
            </p>
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
              {isSubmitting ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
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
