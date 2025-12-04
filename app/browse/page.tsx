import { supabase } from '@/lib/supabase';
import { CategoryCard, CategoryCardSkeleton } from '@/components/content/category-card';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Suspense } from 'react';

async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data;
}

async function CategoriesGrid() {
  const categories = await getCategories();

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No categories available yet.</p>
        <p className="text-muted-foreground text-sm mt-2">Check back later for content updates.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}

function CategoriesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Breadcrumbs items={[{ label: 'Browse' }]} />
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Knowledge Base</h1>
        <p className="text-muted-foreground text-lg">
          Explore our comprehensive collection of training materials and resources.
        </p>
      </div>

      <Suspense fallback={<CategoriesGridSkeleton />}>
        <CategoriesGrid />
      </Suspense>
    </div>
  );
}
