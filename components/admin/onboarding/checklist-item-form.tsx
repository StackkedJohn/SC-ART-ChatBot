'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { OnboardingChecklistItem, OnboardingItemType, Quiz } from '@/lib/supabase';

interface ChecklistItemFormProps {
  item?: OnboardingChecklistItem;
  mode: 'create' | 'edit';
}

interface FormData {
  title: string;
  description: string;
  item_type: OnboardingItemType;
  display_order: number;
  is_required: boolean;
  archived: boolean;
  // Type-specific configs
  quiz_id?: string;
  passing_score?: number;
  category_name?: string;
  estimated_time_minutes?: number;
  duration_minutes?: number;
  verification_type?: string;
  verifier_role?: string;
  tasks?: string[];
  task_type?: string;
  required_fields?: string[];
}

export function ChecklistItemForm({ item, mode }: ChecklistItemFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [tasks, setTasks] = useState<string[]>([]);
  const [newTask, setNewTask] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: item
      ? {
          title: item.title,
          description: item.description || '',
          item_type: item.item_type,
          display_order: item.display_order,
          is_required: item.is_required,
          archived: item.archived ?? false,
          // Extract from config
          quiz_id: item.config?.quiz_id,
          passing_score: item.config?.passing_score || 80,
          category_name: item.config?.category_name,
          estimated_time_minutes: item.config?.estimated_time_minutes || 30,
          duration_minutes: item.config?.duration_minutes || 30,
          verification_type: item.config?.verification_type,
          verifier_role: item.config?.verifier_role || 'admin',
          tasks: item.config?.tasks || [],
          task_type: item.config?.task_type,
          required_fields: item.config?.required_fields || [],
        }
      : {
          title: '',
          description: '',
          item_type: 'task_completion',
          display_order: 1,
          is_required: true,
          archived: false,
          passing_score: 80,
          estimated_time_minutes: 30,
          duration_minutes: 30,
          verifier_role: 'admin',
          tasks: [],
          required_fields: [],
        },
  });

  const selectedType = watch('item_type');

  // Fetch available quizzes
  useEffect(() => {
    async function loadQuizzes() {
      try {
        const res = await fetch('/api/quizzes');
        if (res.ok) {
          const data = await res.json();
          setQuizzes(data.quizzes || []);
        }
      } catch (error) {
        console.error('Failed to load quizzes:', error);
      }
    }
    loadQuizzes();
  }, []);

  // Initialize tasks from item config
  useEffect(() => {
    if (item?.config?.tasks) {
      setTasks(item.config.tasks);
    }
  }, [item]);

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, newTask.trim()]);
      setNewTask('');
    }
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      // Build type-specific config
      let config: Record<string, any> = {};

      switch (data.item_type) {
        case 'quiz':
          config = {
            quiz_id: data.quiz_id,
            passing_score: data.passing_score || 80,
          };
          break;

        case 'handbook_review':
          config = {
            category_name: data.category_name,
            estimated_time_minutes: data.estimated_time_minutes || 30,
          };
          break;

        case 'task_completion':
          config = {
            tasks: tasks,
            task_type: data.task_type,
          };
          break;

        case 'manager_qa':
          config = {
            duration_minutes: data.duration_minutes || 30,
          };
          break;

        case 'verification':
          config = {
            verification_type: data.verification_type,
            verifier_role: data.verifier_role || 'admin',
          };
          break;

        case 'profile_update':
          config = {
            required_fields: ['bio', 'phone_number', 'emergency_contact_name', 'emergency_contact_phone', 'profile_picture'],
          };
          break;
      }

      const payload = {
        title: data.title,
        description: data.description,
        item_type: data.item_type,
        display_order: Number(data.display_order),
        is_required: data.is_required,
        archived: data.archived,
        config,
      };

      const url = mode === 'create' ? '/api/onboarding/checklist' : `/api/onboarding/checklist/${item?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save checklist item');
      }

      toast({
        title: 'Success',
        description: `Checklist item ${mode === 'create' ? 'created' : 'updated'} successfully`,
      });

      router.push('/admin/onboarding');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save checklist item',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Define the checklist item title and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="e.g., Complete Safety Training"
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Provide instructions or context for this item"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item_type">Item Type *</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setValue('item_type', value as OnboardingItemType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profile_update">Profile Update</SelectItem>
                  <SelectItem value="handbook_review">Handbook Review</SelectItem>
                  <SelectItem value="task_completion">Task Completion</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="manager_qa">Manager Q&A</SelectItem>
                  <SelectItem value="verification">Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="display_order">Display Order *</Label>
              <Input
                id="display_order"
                type="number"
                min="1"
                {...register('display_order', { required: true, valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_required"
                  checked={watch('is_required')}
                  onCheckedChange={(checked) => setValue('is_required', checked)}
                />
                <Label htmlFor="is_required" className="cursor-pointer">
                  Required Item
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="archived"
                  checked={!watch('archived')}
                  onCheckedChange={(checked) => setValue('archived', !checked)}
                />
                <Label htmlFor="archived" className="cursor-pointer">
                  Active
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type-Specific Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Configure settings specific to {selectedType.replace('_', ' ')} items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quiz Configuration */}
          {selectedType === 'quiz' && (
            <>
              <div>
                <Label htmlFor="quiz_id">Select Quiz *</Label>
                <Select
                  value={watch('quiz_id')}
                  onValueChange={(value) => setValue('quiz_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a quiz" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes.map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {quizzes.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    No quizzes available. Create a quiz first.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="passing_score">Passing Score (%)</Label>
                <Input
                  id="passing_score"
                  type="number"
                  min="0"
                  max="100"
                  {...register('passing_score', { valueAsNumber: true })}
                />
              </div>
            </>
          )}

          {/* Handbook Review Configuration */}
          {selectedType === 'handbook_review' && (
            <>
              <div>
                <Label htmlFor="category_name">Category Name</Label>
                <Input
                  id="category_name"
                  {...register('category_name')}
                  placeholder="e.g., Employee Handbook, Safety Guidelines"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Reference to knowledge base category
                </p>
              </div>

              <div>
                <Label htmlFor="estimated_time_minutes">Estimated Time (minutes)</Label>
                <Input
                  id="estimated_time_minutes"
                  type="number"
                  min="1"
                  {...register('estimated_time_minutes', { valueAsNumber: true })}
                />
              </div>
            </>
          )}

          {/* Task Completion Configuration */}
          {selectedType === 'task_completion' && (
            <>
              <div>
                <Label htmlFor="task_type">Task Type</Label>
                <Input
                  id="task_type"
                  {...register('task_type')}
                  placeholder="e.g., shadowing, project, team_introduction"
                />
              </div>

              <div>
                <Label>Tasks</Label>
                <div className="space-y-2">
                  {tasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={task} readOnly className="flex-1" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTask(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <Input
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder="Add a new task"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTask();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTask}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Manager Q&A Configuration */}
          {selectedType === 'manager_qa' && (
            <div>
              <Label htmlFor="duration_minutes">Session Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                min="15"
                step="15"
                {...register('duration_minutes', { valueAsNumber: true })}
              />
            </div>
          )}

          {/* Verification Configuration */}
          {selectedType === 'verification' && (
            <>
              <div>
                <Label htmlFor="verification_type">Verification Type</Label>
                <Input
                  id="verification_type"
                  {...register('verification_type')}
                  placeholder="e.g., equipment_check, workspace_setup, software_access"
                />
              </div>

              <div>
                <Label htmlFor="verifier_role">Verifier Role</Label>
                <Select
                  value={watch('verifier_role')}
                  onValueChange={(value) => setValue('verifier_role', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="artist">Artist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Profile Update Info */}
          {selectedType === 'profile_update' && (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Profile update items automatically require: bio, phone number, emergency contact, and
                profile picture.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/onboarding')}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {mode === 'create' ? 'Create Item' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
