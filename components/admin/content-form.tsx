'use client';

import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ContentItem, Category, Subcategory } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

// Dynamic import for markdown editor to avoid SSR issues
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface ContentFormData {
  title: string;
  content: string;
  subcategory_id: string;
  is_active: boolean;
  sort_order: number;
}

interface ContentFormProps {
  contentItem?: ContentItem & {
    subcategories?: Subcategory & {
      categories?: Category;
    };
  };
  onSubmit: (data: ContentFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ContentForm({ contentItem, onSubmit, onCancel, isSubmitting = false }: ContentFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [content, setContent] = useState(contentItem?.content || '');
  const [isActive, setIsActive] = useState(contentItem?.is_active ?? true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ContentFormData>({
    defaultValues: {
      title: contentItem?.title || '',
      content: contentItem?.content || '',
      subcategory_id: contentItem?.subcategory_id || '',
      is_active: contentItem?.is_active ?? true,
      sort_order: contentItem?.sort_order || 0,
    },
  });

  const selectedSubcategoryId = watch('subcategory_id');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    (contentItem?.subcategories as any)?.category_id || ''
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    setValue('content', content);
  }, [content, setValue]);

  useEffect(() => {
    setValue('is_active', isActive);
  }, [isActive, setValue]);

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

  async function fetchSubcategories(categoryId: string) {
    setLoadingSubcategories(true);
    try {
      const response = await fetch(`/api/subcategories?category_id=${categoryId}`);
      const data = await response.json();
      if (response.ok) {
        setSubcategories(data.subcategories || []);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    } finally {
      setLoadingSubcategories(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{contentItem ? 'Edit Content' : 'Create New Content'}</CardTitle>
        <CardDescription>
          {contentItem
            ? 'Update the content information below.'
            : 'Add new content with markdown formatting support.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category_select">
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
                onValueChange={(value) => {
                  setSelectedCategoryId(value);
                  setValue('subcategory_id', '');
                }}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory_id">
              Subcategory <span className="text-red-500">*</span>
            </Label>
            {loadingSubcategories ? (
              <div className="flex items-center gap-2 p-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading subcategories...</span>
              </div>
            ) : (
              <Select
                value={selectedSubcategoryId}
                onValueChange={(value) => setValue('subcategory_id', value)}
                disabled={isSubmitting || !selectedCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedCategoryId ? 'Select a subcategory' : 'Select category first'} />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.subcategory_id && <p className="text-sm text-red-500">Subcategory is required</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="e.g., How to Use Safety Equipment"
              disabled={isSubmitting}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              Content (Markdown) <span className="text-red-500">*</span>
            </Label>
            <div data-color-mode="light">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                preview="edit"
                height={400}
                visibleDragbar={false}
                highlightEnable={false}
              />
            </div>
            {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
            <p className="text-sm text-muted-foreground">
              Use markdown formatting: **bold**, *italic*, # heading, - list, etc.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSubmitting}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Active (visible to users)
            </Label>
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
              ) : contentItem ? (
                'Update Content'
              ) : (
                'Create Content'
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
