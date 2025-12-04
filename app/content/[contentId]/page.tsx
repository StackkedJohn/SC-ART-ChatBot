import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ContentViewer } from '@/components/content/content-viewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{
    contentId: string;
  }>;
}

async function getContentWithRelations(contentId: string) {
  const { data: content, error } = await supabase
    .from('content_items')
    .select(`
      *,
      subcategory:subcategories(
        id,
        name,
        category_id,
        category:categories(
          id,
          name
        )
      )
    `)
    .eq('id', contentId)
    .eq('is_active', true)
    .single();

  if (error || !content) {
    return null;
  }

  return content;
}

async function getRelatedContent(subcategoryId: string, currentContentId: string) {
  const { data, error } = await supabase
    .from('content_items')
    .select('id, title, updated_at')
    .eq('subcategory_id', subcategoryId)
    .eq('is_active', true)
    .neq('id', currentContentId)
    .order('sort_order', { ascending: true })
    .limit(5);

  if (error) {
    console.error('Error fetching related content:', error);
    return [];
  }

  return data;
}

function RelatedContentCard({ item }: any) {
  return (
    <Link href={`/content/${item.id}`}>
      <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/50 cursor-pointer group">
        <CardHeader className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                {item.title}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Updated {new Date(item.updated_at).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}

function RelatedContentSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-4 w-4 flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

async function RelatedContentSection({ subcategoryId, currentContentId }: { subcategoryId: string; currentContentId: string }) {
  const relatedContent = await getRelatedContent(subcategoryId, currentContentId);

  if (relatedContent.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {relatedContent.map((item) => (
        <RelatedContentCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function ContentSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ContentPage({ params }: PageProps) {
  const { contentId } = await params;
  const content = await getContentWithRelations(contentId);

  if (!content || !content.subcategory) {
    notFound();
  }

  const { subcategory } = content;
  const category = subcategory.category;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: 'Browse', href: '/browse' },
            { label: category.name, href: `/browse/${category.id}` },
            { label: subcategory.name, href: `/browse/${category.id}/${subcategory.id}` },
            { label: content.title },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main content */}
        <div className="lg:col-span-3">
          <Link href={`/browse/${category.id}/${subcategory.id}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {subcategory.name}
            </Button>
          </Link>

          <Suspense fallback={<ContentSkeleton />}>
            <ContentViewer contentItem={content} showMetadata={true} />
          </Suspense>
        </div>

        {/* Sidebar with related content */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            {/* Content info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Content Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <Link
                    href={`/browse/${category.id}`}
                    className="block text-primary hover:underline mt-1"
                  >
                    {category.name}
                  </Link>
                </div>
                <div>
                  <span className="text-muted-foreground">Subcategory:</span>
                  <Link
                    href={`/browse/${category.id}/${subcategory.id}`}
                    className="block text-primary hover:underline mt-1"
                  >
                    {subcategory.name}
                  </Link>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <p className="mt-1">{new Date(content.updated_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Related content */}
            <div>
              <h3 className="text-sm font-medium mb-3">Related Content</h3>
              <Suspense fallback={<RelatedContentSkeleton />}>
                <RelatedContentSection
                  subcategoryId={subcategory.id}
                  currentContentId={contentId}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
