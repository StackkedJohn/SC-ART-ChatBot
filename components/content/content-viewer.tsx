'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ContentItem } from '@/lib/supabase';

interface ContentViewerProps {
  contentItem: ContentItem;
  showMetadata?: boolean;
  className?: string;
}

export function ContentViewer({ contentItem, showMetadata = false, className = '' }: ContentViewerProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{contentItem.title}</CardTitle>
        {showMetadata && (
          <CardDescription>
            Last updated: {new Date(contentItem.updated_at).toLocaleDateString()}
            {contentItem.last_embedded_at && (
              <> • Embeddings generated: {new Date(contentItem.last_embedded_at).toLocaleDateString()}</>
            )}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={{
              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mb-3 mt-5" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mb-2 mt-4" {...props} />,
              p: ({ node, ...props }) => <p className="mb-4 leading-7" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
              li: ({ node, ...props }) => <li className="ml-4" {...props} />,
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />
              ),
              code: ({ node, inline, ...props }: any) =>
                inline ? (
                  <code className="bg-gray-100 rounded px-1 py-0.5 text-sm font-mono" {...props} />
                ) : (
                  <code className="block bg-gray-100 rounded p-4 text-sm font-mono overflow-x-auto" {...props} />
                ),
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full border-collapse border border-gray-300" {...props} />
                </div>
              ),
              th: ({ node, ...props }) => (
                <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left" {...props} />
              ),
              td: ({ node, ...props }) => <td className="border border-gray-300 px-4 py-2" {...props} />,
              a: ({ node, ...props }) => (
                <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
              ),
              hr: ({ node, ...props }) => <hr className="my-6 border-t border-gray-300" {...props} />,
            }}
          >
            {contentItem.content}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
