'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from 'lucide-react';

interface QASchedulerProps {
  itemId: string;
  userId: string;
}

export function QAScheduler({ itemId, userId }: QASchedulerProps) {
  const [session, setSession] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/onboarding/qa-session?internId=${userId}`);
        const data = await response.json();
        setSession(data);
      } catch (error) {
        console.error('Error fetching Q&A session:', error);
      }
    };

    fetchSession();
  }, [userId]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    setIsSubmitting(true);
    try {
      await fetch('/api/onboarding/qa-session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session?.id,
          status: 'scheduled',
          scheduled_at: formData.get('scheduled_at'),
          agenda: formData.get('agenda'),
        }),
      });

      toast({
        title: 'Session scheduled',
        description: 'Your Q&A session has been scheduled',
      });

      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule session',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (session.status === 'completed') {
    return (
      <div className="text-sm text-green-600">
        Q&A session completed on {new Date(session.completed_at).toLocaleDateString()}
      </div>
    );
  }

  if (session.status === 'scheduled') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4" />
          <span>
            Scheduled for: {new Date(session.scheduled_at).toLocaleString()}
          </span>
        </div>
        {session.agenda && (
          <div className="text-sm text-muted-foreground">
            <strong>Agenda:</strong> {session.agenda}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSchedule} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="scheduled_at">Preferred Date & Time</Label>
        <Input
          id="scheduled_at"
          name="scheduled_at"
          type="datetime-local"
          required
        />
        <p className="text-xs text-muted-foreground">
          Request a time - your manager will confirm
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agenda">Topics to Discuss (Optional)</Label>
        <Textarea
          id="agenda"
          name="agenda"
          placeholder="List any questions or topics you'd like to cover"
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Scheduling...' : 'Request Session'}
      </Button>
    </form>
  );
}
