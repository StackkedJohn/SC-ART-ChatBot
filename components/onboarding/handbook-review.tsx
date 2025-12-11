'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface HandbookReviewProps {
  itemId: string;
  userId: string;
}

export function HandbookReview({ itemId, userId }: HandbookReviewProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleComplete = async () => {
    if (!acknowledged) return;

    setIsSubmitting(true);
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          checklistItemId: itemId,
          progressData: { acknowledged: true, completed_at: new Date().toISOString() },
        }),
      });

      toast({
        title: 'Handbook reviewed',
        description: 'Thank you for reviewing the handbook',
      });

      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete handbook review',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="prose prose-sm max-w-none">
        <p>Please review the handbook content provided to you. Once you've finished reading:</p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          id="acknowledge"
          checked={acknowledged}
          onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
        />
        <Label htmlFor="acknowledge" className="cursor-pointer">
          I have read and understood the handbook content
        </Label>
      </div>

      <Button onClick={handleComplete} disabled={!acknowledged || isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Complete Review'}
      </Button>
    </div>
  );
}
