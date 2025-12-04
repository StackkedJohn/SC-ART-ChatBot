'use client';

import { useState } from 'react';
import { Quiz, Subcategory } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface QuizFormProps {
  quiz?: Partial<Quiz>;
  subcategories: Subcategory[];
  onSubmit: (data: QuizFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface QuizFormData {
  title: string;
  description: string;
  subcategory_id: string;
  time_limit_minutes: number | null;
  passing_score: number;
  is_published: boolean;
}

export function QuizForm({ quiz, subcategories, onSubmit, onCancel, isSubmitting = false }: QuizFormProps) {
  const [formData, setFormData] = useState<QuizFormData>({
    title: quiz?.title || '',
    description: quiz?.description || '',
    subcategory_id: quiz?.subcategory_id || 'none',
    time_limit_minutes: quiz?.time_limit_minutes || null,
    passing_score: quiz?.passing_score || 70,
    is_published: quiz?.is_published || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Convert 'none' to null for the API
    const submitData = {
      ...formData,
      subcategory_id: formData.subcategory_id === 'none' ? null : formData.subcategory_id,
    };
    await onSubmit(submitData as QuizFormData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{quiz?.id ? 'Edit Quiz' : 'Create New Quiz'}</CardTitle>
          <CardDescription>
            Configure quiz settings and metadata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Quiz Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Customer Service Basics"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what this quiz covers..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Select
              value={formData.subcategory_id}
              onValueChange={(value) => setFormData({ ...formData, subcategory_id: value })}
            >
              <SelectTrigger id="subcategory">
                <SelectValue placeholder="Select a subcategory (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {subcategories.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                min={0}
                value={formData.time_limit_minutes || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    time_limit_minutes: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="No limit"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passingScore">Passing Score (%) *</Label>
              <Input
                id="passingScore"
                type="number"
                min={0}
                max={100}
                value={formData.passing_score}
                onChange={(e) =>
                  setFormData({ ...formData, passing_score: parseInt(e.target.value) || 70 })
                }
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="published">Published</Label>
              <p className="text-sm text-muted-foreground">
                Make this quiz visible to users
              </p>
            </div>
            <Switch
              id="published"
              checked={formData.is_published}
              onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : quiz?.id ? 'Update Quiz' : 'Create Quiz'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
