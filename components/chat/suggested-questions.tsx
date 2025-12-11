import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { RecentActivity } from './recent-activity';

const fallbackQuestions = [
  "What's the discharge rate for Heather Royal?",
  'How do I create a new design template?',
  'What are the responsibilities of a Staff Artist?',
  'How do I read an Art Request Form?',
  'What are the steps for CSI prevention?',
  'What software should I learn as an intern?',
];

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">How can I help you today?</h2>
        <p className="text-muted-foreground">
          Ask me anything about the Art department processes, procedures, and training materials.
        </p>
      </div>

      {/* Dynamic recent activity and FAQs */}
      <RecentActivity onSelect={onSelect} />

      {/* Fallback suggested questions (shown if no recent activity) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {fallbackQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              className="justify-start text-left h-auto py-3 px-4 hover:bg-brand-barely-butter/50 hover:border-brand-sc-pink/30"
              onClick={() => onSelect(question)}
            >
              <span className="text-sm font-sans tracking-normal leading-relaxed">{question}</span>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
