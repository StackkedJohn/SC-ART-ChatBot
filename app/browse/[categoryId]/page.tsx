import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SubcategoryList, SubcategoryListSkeleton } from '@/components/content/subcategory-list';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

interface PageProps {
  params: Promise<{
    categoryId: string;
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

async function getSubcategories(categoryId: string) {
  // Get subcategories with content count
  const { data, error } = await supabase
    .from('subcategories')
    .select(`
      *,
      content_items:content_items(count)
    `)
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching subcategories:', error);
    return [];
  }

  // Transform data to include content count
  return data.map((sub) => ({
    ...sub,
    content_count: Array.isArray(sub.content_items) ? sub.content_items.length : 0,
  }));
}

async function SubcategoriesContent({ categoryId }: { categoryId: string }) {
  const subcategories = await getSubcategories(categoryId);

  return <SubcategoryList subcategories={subcategories} categoryId={categoryId} />;
}

export default async function CategoryPage({ params }: PageProps) {
  const { categoryId } = await params;
  const category = await getCategory(categoryId);

  if (!category) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Breadcrumbs
          items={[{ label: 'Browse', href: '/browse' }, { label: category.name }]}
        />
      </div>

      <div className="mb-6">
        <Link href="/browse">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Categories
          </Button>
        </Link>

        <h1 className="text-4xl font-bold tracking-tight mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground text-lg">{category.description}</p>
        )}
      </div>

      <Suspense fallback={<SubcategoryListSkeleton />}>
        <SubcategoriesContent categoryId={categoryId} />
      </Suspense>
    </div>
  );
}
