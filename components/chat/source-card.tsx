import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import Link from 'next/link';

interface Source {
  contentItemId: string;
  title: string;
  categoryName: string;
  subcategoryName: string;
  excerpt: string;
  similarity: number;
}

interface SourceCardProps {
  sources: Source[];
}

export function SourceCard({ sources }: SourceCardProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Sources ({sources.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sources.map((source, index) => (
          <Link
            key={index}
            href={`/content/${source.contentItemId}`}
            className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{source.title}</p>
                <p className="text-xs text-muted-foreground">
                  {source.categoryName} → {source.subcategoryName}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {source.excerpt}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 text-xs">
                {source.similarity}%
              </Badge>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
