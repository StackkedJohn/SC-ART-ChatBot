'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Circle,
  Clock,
  User,
  BookOpen,
  CheckSquare,
  FileQuestion,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const typeIcons = {
  profile_update: User,
  handbook_review: BookOpen,
  task_completion: CheckSquare,
  quiz: FileQuestion,
  manager_qa: MessageSquare,
  verification: Shield,
};

const statusConfig = {
  pending: {
    icon: Circle,
    color: 'text-muted-foreground',
    badge: 'secondary' as const,
  },
  in_progress: { icon: Clock, color: 'text-blue-600', badge: 'default' as const },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-600',
    badge: 'default' as const,
  },
};

interface ChecklistItemCardProps {
  item: {
    id: string;
    title: string;
    description: string;
    item_type: keyof typeof typeIcons;
    status: keyof typeof statusConfig;
    is_required: boolean;
    config?: Record<string, any>;
  };
  userId: string;
  children?: React.ReactNode;
}

export function ChecklistItemCard({ item, userId, children }: ChecklistItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(item.status === 'in_progress');

  const StatusIcon = statusConfig[item.status].icon;
  const TypeIcon = typeIcons[item.item_type];

  return (
    <Card
      id={item.id}
      className={cn('transition-all', isExpanded && 'ring-2 ring-primary/20')}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <StatusIcon
              className={cn('w-6 h-6 shrink-0 mt-1', statusConfig[item.status].color)}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <TypeIcon className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-lg">{item.title}</CardTitle>
                {item.is_required && (
                  <Badge variant="outline" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>
              <CardDescription>{item.description}</CardDescription>
            </div>
          </div>

          <Badge variant={statusConfig[item.status].badge} className="shrink-0">
            {item.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      {(isExpanded || item.status === 'completed') && (
        <CardContent>
          {children}

          {item.status !== 'completed' && (
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                variant={isExpanded ? 'outline' : 'default'}
              >
                {isExpanded ? 'Collapse' : 'Start'}
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
