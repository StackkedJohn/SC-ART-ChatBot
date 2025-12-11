'use client';

import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  progress: {
    percentage: number;
    items: Array<{
      id: string;
      title: string;
      type: string;
      status: 'pending' | 'in_progress' | 'completed';
      order: number;
    }>;
  };
}

export function OnboardingLayout({ children, progress }: OnboardingLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sticky progress sidebar */}
      <aside className="hidden lg:block w-80 border-r bg-muted/30 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6">
          <h2 className="font-semibold mb-4">Onboarding Progress</h2>
          <Progress value={progress.percentage} className="mb-6" />
          <p className="text-sm text-muted-foreground mb-6">
            {Math.round(progress.percentage)}% Complete
          </p>

          <nav className="space-y-2">
            {progress.items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors',
                  'hover:bg-accent',
                  item.status === 'completed' && 'opacity-60'
                )}
              >
                {item.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle
                    className={cn(
                      'w-5 h-5 shrink-0 mt-0.5',
                      item.status === 'in_progress'
                        ? 'text-blue-600'
                        : 'text-muted-foreground'
                    )}
                  />
                )}
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.type.replace('_', ' ')}
                  </p>
                </div>
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
