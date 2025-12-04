'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { ContentItem, Category, Subcategory } from '@/lib/supabase';
import { Loader2, Plus, Pencil, Trash2, Filter, Eye } from 'lucide-react';

type ContentItemWithRelations = ContentItem & {
  subcategories?: Subcategory & {
    categories?: Category;
  };
};

export default function ContentPage() {
  const [contentItems, setContentItems] = useState<ContentItemWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [filterSubcategoryId, setFilterSubcategoryId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchContentItems();
  }, []);

  useEffect(() => {
    if (filterCategoryId && filterCategoryId !== 'all') {
      fetchSubcategories(filterCategoryId);
    } else {
      setSubcategories([]);
      setFilterSubcategoryId('all');
    }
  }, [filterCategoryId]);

  useEffect(() => {
    fetchContentItems();
  }, [filterSubcategoryId, filterStatus]);

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

  async function fetchSubcategories(categoryId: string) {
    try {
      const response = await fetch(`/api/subcategories?category_id=${categoryId}`);
      const data = await response.json();
      if (response.ok) {
        setSubcategories(data.subcategories || []);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  }

  async function fetchContentItems() {
    setLoading(true);
    try {
      let url = '/api/content';
      const params = new URLSearchParams();

      if (filterSubcategoryId !== 'all') {
        params.append('subcategory_id', filterSubcategoryId);
      }

      if (filterStatus !== 'all') {
        params.append('is_active', filterStatus);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch content items');
      }

      // Filter by category if needed (since API doesn't support direct category filter)
      let items = data.contentItems || [];
      if (filterCategoryId !== 'all' && filterSubcategoryId === 'all') {
        items = items.filter(
          (item: ContentItemWithRelations) =>
            (item.subcategories as any)?.categories?.id === filterCategoryId
        );
      }

      setContentItems(items);
    } catch (error) {
      console.error('Error fetching content items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content items. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(contentId: string, contentTitle: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${contentTitle}"? This will also delete all associated embeddings. This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(contentId);

    try {
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete content item');
      }

      toast({
        title: 'Success',
        description: 'Content item deleted successfully.',
      });

      await fetchContentItems();
    } catch (error: any) {
      console.error('Error deleting content item:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete content item. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  }

  if (loading && contentItems.length === 0) {
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
          <h1 className="text-3xl font-bold tracking-tight">Content Items</h1>
          <p className="text-muted-foreground">Manage your knowledge base content with markdown support.</p>
        </div>
        <Button asChild>
          <Link href="/admin/content/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Content
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subcategory</label>
              <Select
                value={filterSubcategoryId}
                onValueChange={setFilterSubcategoryId}
                disabled={filterCategoryId === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder={filterCategoryId === 'all' ? 'Select category first' : 'All subcategories'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subcategories</SelectItem>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {contentItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No content items found.</p>
            <Button asChild>
              <Link href="/admin/content/new">
                <Plus className="mr-2 h-4 w-4" />
                Create your first content item
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contentItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{(item.subcategories as any)?.categories?.icon}</span>
                      <span className="text-sm text-muted-foreground">
                        {(item.subcategories as any)?.categories?.name}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-sm text-muted-foreground">
                        {item.subcategories?.name}
                      </span>
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {item.last_embedded_at && (
                        <Badge variant="outline">Embeddings Generated</Badge>
                      )}
                    </div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {item.content.substring(0, 150)}
                      {item.content.length > 150 ? '...' : ''}
                    </CardDescription>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Sort: {item.sort_order}</span>
                      <span>Updated: {new Date(item.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                      disabled={deletingId === item.id}
                    >
                      <Link href={`/admin/content/${item.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? (
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
