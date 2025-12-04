'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ContentForm } from '@/components/admin/content-form';
import { ContentViewer } from '@/components/content/content-viewer';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { ContentItem, Category, Subcategory } from '@/lib/supabase';

interface ContentFormData {
  title: string;
  content: string;
  subcategory_id: string;
  is_active: boolean;
  sort_order: number;
}

type ContentItemWithRelations = ContentItem & {
  subcategories?: Subcategory & {
    category_id: string;
    categories?: Category;
  };
};

export default function EditContentPage() {
  const [contentItem, setContentItem] = useState<ContentItemWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const contentId = params.contentId as string;

  useEffect(() => {
    if (contentId) {
      fetchContentItem();
    }
  }, [contentId]);

  async function fetchContentItem() {
    try {
      const response = await fetch(`/api/content/${contentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch content');
      }

      setContentItem(data.contentItem);
    } catch (error: any) {
      console.error('Error fetching content:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load content. Please try again.',
        variant: 'destructive',
      });
      router.push('/admin/content');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(data: ContentFormData) {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update content');
      }

      toast({
        title: 'Success',
        description: 'Content updated successfully.',
      });

      // Refresh the content item
      setContentItem(result.contentItem);
    } catch (error: any) {
      console.error('Error updating content:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGenerateEmbeddings() {
    if (!contentItem) return;

    const confirmed = window.confirm(
      'This will regenerate embeddings for this content item. Existing embeddings will be replaced. Continue?'
    );

    if (!confirmed) return;

    setIsGeneratingEmbeddings(true);

    try {
      const response = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_item_id: contentId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate embeddings');
      }

      toast({
        title: 'Success',
        description: `Generated ${result.chunksCreated || 0} embedding chunks successfully.`,
      });

      // Refresh content item to get updated last_embedded_at
      await fetchContentItem();
    } catch (error: any) {
      console.error('Error generating embeddings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate embeddings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  }

  function handleCancel() {
    router.push('/admin/content');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contentItem) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Not Found</h1>
          <p className="text-muted-foreground">The content you are looking for does not exist.</p>
        </div>
        <Button asChild>
          <Link href="/admin/content">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Content
          </Link>
        </Button>
      </div>
    );
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Content</h1>
            <p className="text-muted-foreground">Update content information and generate embeddings.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Embedding Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              {contentItem.last_embedded_at ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Embeddings Generated</Badge>
                    <span className="text-sm text-muted-foreground">
                      Last generated: {new Date(contentItem.last_embedded_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Embeddings are used for semantic search and AI-powered responses.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">No Embeddings</Badge>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generate embeddings to enable semantic search for this content.
                  </p>
                </div>
              )}
            </div>
            <Button
              onClick={handleGenerateEmbeddings}
              disabled={isGeneratingEmbeddings}
              size="lg"
            >
              {isGeneratingEmbeddings ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {contentItem.last_embedded_at ? 'Regenerate Embeddings' : 'Generate Embeddings'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {showPreview && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Content Preview</h2>
          <ContentViewer contentItem={contentItem} showMetadata />
        </div>
      )}

      <div className="max-w-4xl">
        <ContentForm
          contentItem={contentItem}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
