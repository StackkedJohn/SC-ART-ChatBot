'use client';

import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    pending: {
      variant: 'outline' as const,
      className: 'bg-gray-100 text-gray-700 border-gray-300',
      label: 'Pending',
      icon: false,
    },
    processing: {
      variant: 'default' as const,
      className: 'bg-blue-100 text-blue-700 border-blue-300',
      label: 'Processing',
      icon: true,
    },
    completed: {
      variant: 'default' as const,
      className: 'bg-green-100 text-green-700 border-green-300',
      label: 'Completed',
      icon: false,
    },
    failed: {
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-700 border-red-300',
      label: 'Failed',
      icon: false,
    },
  };

  const config = variants[status];

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.icon && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      {config.label}
    </Badge>
  );
}
