'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Subcategory } from '@/lib/supabase';

interface SubcategoryWithCount extends Subcategory {
  content_count?: number;
}

interface SubcategoryListProps {
  subcategories: SubcategoryWithCount[];
  categoryId: string;
  className?: string;
}

export function SubcategoryList({ subcategories, categoryId, className }: SubcategoryListProps) {
  if (subcategories.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No subcategories found in this category.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {subcategories.map((subcategory) => (
        <Link key={subcategory.id} href={`/browse/${categoryId}/${subcategory.id}`}>
          <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/50 cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {subcategory.name}
                    {typeof subcategory.content_count === 'number' && (
                      <Badge variant="secondary" className="text-xs">
                        {subcategory.content_count} {subcategory.content_count === 1 ? 'item' : 'items'}
                      </Badge>
                    )}
                  </CardTitle>
                  {subcategory.description && (
                    <CardDescription className="mt-2">{subcategory.description}</CardDescription>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function SubcategoryListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="space-y-3">
              <div className="h-6 w-1/3 bg-muted animate-pulse rounded" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-4/5 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
