'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import type { Category } from '@/lib/supabase';

interface CategoryCardProps {
  category: Category;
  className?: string;
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  // Get icon component dynamically or fallback to Folder
  const IconComponent = category.icon && Icons[category.icon as keyof typeof Icons]
    ? Icons[category.icon as keyof typeof Icons]
    : Icons.Folder;

  return (
    <Link href={`/browse/${category.id}`}>
      <Card
        className={cn(
          'h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/50',
          className
        )}
      >
        <CardHeader className="flex flex-row items-center space-x-4 pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {/* @ts-ignore - Dynamic icon component */}
            <IconComponent className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{category.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {category.description && (
            <CardDescription className="line-clamp-3">{category.description}</CardDescription>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function CategoryCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
