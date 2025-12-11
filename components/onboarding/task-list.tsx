'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TaskListProps {
  itemId: string;
  userId: string;
  tasks: string[];
  initialCompletedTasks?: number[];
}

export function TaskList({
  itemId,
  userId,
  tasks,
  initialCompletedTasks = [],
}: TaskListProps) {
  const [completedTasks, setCompletedTasks] = useState<number[]>(initialCompletedTasks);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const allTasksCompleted = completedTasks.length === tasks.length;

  const toggleTask = (index: number) => {
    setCompletedTasks((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          checklistItemId: itemId,
          progressData: { completed_tasks: completedTasks },
        }),
      });

      toast({
        title: 'Tasks completed',
        description: 'All tasks have been marked as complete',
      });

      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete tasks',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {tasks.map((task, index) => (
          <div key={index} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
            <Checkbox
              id={`task-${index}`}
              checked={completedTasks.includes(index)}
              onCheckedChange={() => toggleTask(index)}
            />
            <label
              htmlFor={`task-${index}`}
              className="text-sm cursor-pointer flex-1"
            >
              {task}
            </label>
          </div>
        ))}
      </div>

      {allTasksCompleted && (
        <Button onClick={handleComplete} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Mark as Complete'}
        </Button>
      )}
    </div>
  );
}
