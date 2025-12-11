'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp, Loader2 } from 'lucide-react';

interface ActivityItem {
  query: string;
  count: number;
  lastUsed: string;
  isUserQuery: boolean;
}

interface RecentActivityProps {
  onSelect: (question: string) => void;
}

export function RecentActivity({ onSelect }: RecentActivityProps) {
  const [recentSearches, setRecentSearches] = useState<ActivityItem[]>([]);
  const [faqs, setFaqs] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      const response = await fetch('/api/chat/activity');
      if (!response.ok) throw new Error('Failed to fetch activity');

      const data = await response.json();
      setRecentSearches(data.recentSearches || []);
      setFaqs(data.faqs || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-sc-pink" />
      </div>
    );
  }

  const hasContent = recentSearches.length > 0 || faqs.length > 0;

  return (
    <div className="space-y-6">
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-sc-pink" />
              <CardTitle className="text-sm">Your Recent Searches</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {recentSearches.slice(0, 6).map((item, index) => (
              <Button
                key={`recent-${index}`}
                variant="outline"
                className="justify-start text-left h-auto py-3 px-4 hover:bg-brand-barely-butter/50 hover:border-brand-sc-pink/30"
                onClick={() => onSelect(item.query)}
              >
                <span className="text-sm font-sans tracking-normal leading-relaxed line-clamp-2">
                  {item.query}
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Popular Questions (FAQs) */}
      {faqs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-sc-pink" />
              <CardTitle className="text-sm">Frequently Asked Questions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {faqs.slice(0, 6).map((item, index) => (
              <Button
                key={`faq-${index}`}
                variant="outline"
                className="justify-start text-left h-auto py-3 px-4 hover:bg-brand-barely-butter/50 hover:border-brand-sc-pink/30"
                onClick={() => onSelect(item.query)}
              >
                <div className="flex flex-col items-start gap-1 w-full">
                  <span className="text-sm font-sans tracking-normal leading-relaxed line-clamp-2">
                    {item.query}
                  </span>
                  {item.count > 1 && (
                    <span className="text-xs text-muted-foreground">
                      Asked {item.count} times
                    </span>
                  )}
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Fallback if no activity */}
      {!hasContent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">No Activity Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your search history and frequently asked questions will appear here as you use the knowledge base.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
