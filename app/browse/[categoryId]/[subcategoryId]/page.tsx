import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, ChevronRight } from 'lucide-react';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{
    categoryId: string;
    subcategoryId: string;
  }>;
}

async function getCategory(categoryId: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getSubcategory(subcategoryId: string) {
  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .eq('id', subcategoryId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getContentItems(subcategoryId: string) {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('subcategory_id', subcategoryId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching content items:', error);
    return [];
  }

  return data;
}

function ContentItemCard({ item, categoryId, subcategoryId }: any) {
  // Generate preview text (first 150 characters)
  const getPreview = (content: string) => {
    const plainText = content.replace(/[#*`\[\]]/g, '').trim();
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  };

  return (
    <Link href={`/content/${item.id}`}>
      <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/50 cursor-pointer group h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {item.title}
                </CardTitle>
                <CardDescription className="mt-2 line-clamp-2">
                  {getPreview(item.content)}
                </CardDescription>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Updated {new Date(item.updated_at).toLocaleDateString()}</span>
            {item.last_embedded_at && (
              <Badge variant="outline" className="text-xs">
                AI Ready
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ContentListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 mt-1" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function ContentList({ subcategoryId, categoryId }: { subcategoryId: string; categoryId: string }) {
  const contentItems = await getContentItems(subcategoryId);

  if (contentItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No content items found in this subcategory.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {contentItems.map((item) => (
        <ContentItemCard
          key={item.id}
          item={item}
          categoryId={categoryId}
          subcategoryId={subcategoryId}
        />
      ))}
    </div>
  );
}

export default async function SubcategoryPage({ params }: PageProps) {
  const { categoryId, subcategoryId } = await params;
  const [category, subcategory] = await Promise.all([
    getCategory(categoryId),
    getSubcategory(subcategoryId),
  ]);

  if (!category || !subcategory) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: 'Browse', href: '/browse' },
            { label: category.name, href: `/browse/${categoryId}` },
            { label: subcategory.name },
          ]}
        />
      </div>

      <div className="mb-6">
        <Link href={`/browse/${categoryId}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {category.name}
          </Button>
        </Link>

        <h1 className="text-4xl font-bold tracking-tight mb-2">{subcategory.name}</h1>
        {subcategory.description && (
          <p className="text-muted-foreground text-lg">{subcategory.description}</p>
        )}
      </div>

      <Suspense fallback={<ContentListSkeleton />}>
        <ContentList subcategoryId={subcategoryId} categoryId={categoryId} />
      </Suspense>
    </div>
  );
}
