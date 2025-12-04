'use client';

import { useState } from 'react';
import { QuizQuestion } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';

interface QuestionFormProps {
  question?: Partial<QuizQuestion>;
  questionNumber: number;
  onSubmit: (data: QuestionFormData) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

export interface QuestionFormData {
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  correct_answer: string;
  options?: string[];
  explanation?: string;
  points: number;
}

export function QuestionForm({ question, questionNumber, onSubmit, onCancel, onDelete }: QuestionFormProps) {
  const [formData, setFormData] = useState<QuestionFormData>({
    question_text: question?.question_text || '',
    question_type: question?.question_type || 'multiple_choice',
    correct_answer: question?.correct_answer || '',
    options: question?.options || ['', '', '', ''],
    explanation: question?.explanation || '',
    points: question?.points || 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate options for multiple choice
    if (formData.question_type === 'multiple_choice') {
      const validOptions = formData.options?.filter((opt) => opt.trim() !== '');
      if (!validOptions || validOptions.length < 2) {
        alert('Multiple choice questions need at least 2 options');
        return;
      }
      if (!validOptions.includes(formData.correct_answer)) {
        alert('The correct answer must be one of the options');
        return;
      }
    }

    onSubmit(formData);
  };

  const handleTypeChange = (type: 'multiple_choice' | 'true_false' | 'short_answer') => {
    setFormData({
      ...formData,
      question_type: type,
      correct_answer: type === 'true_false' ? 'True' : '',
      options: type === 'multiple_choice' ? ['', '', '', ''] : undefined,
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...(formData.options || []), ''],
    });
  };

  const removeOption = (index: number) => {
    const newOptions = formData.options?.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Question {questionNumber}</CardTitle>
              <CardDescription>Configure question details</CardDescription>
            </div>
            {onDelete && (
              <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
                Delete
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor={`question-text-${questionNumber}`}>Question Text *</Label>
            <Textarea
              id={`question-text-${questionNumber}`}
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              placeholder="Enter your question..."
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`question-type-${questionNumber}`}>Question Type *</Label>
              <Select
                value={formData.question_type}
                onValueChange={(value: any) => handleTypeChange(value)}
              >
                <SelectTrigger id={`question-type-${questionNumber}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="short_answer">Short Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`points-${questionNumber}`}>Points *</Label>
              <Input
                id={`points-${questionNumber}`}
                type="number"
                min={1}
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
          </div>

          {formData.question_type === 'multiple_choice' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Answer Options *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
              {formData.options?.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {formData.options && formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`correct-answer-${questionNumber}`}>Correct Answer *</Label>
            {formData.question_type === 'multiple_choice' ? (
              <Select
                value={formData.correct_answer}
                onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}
              >
                <SelectTrigger id={`correct-answer-${questionNumber}`}>
                  <SelectValue placeholder="Select the correct option" />
                </SelectTrigger>
                <SelectContent>
                  {formData.options
                    ?.filter((opt) => opt.trim() !== '')
                    .map((option, index) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : formData.question_type === 'true_false' ? (
              <Select
                value={formData.correct_answer}
                onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}
              >
                <SelectTrigger id={`correct-answer-${questionNumber}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="True">True</SelectItem>
                  <SelectItem value="False">False</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Textarea
                id={`correct-answer-${questionNumber}`}
                value={formData.correct_answer}
                onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                placeholder="Expected answer..."
                rows={2}
                required
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`explanation-${questionNumber}`}>Explanation (optional)</Label>
            <Textarea
              id={`explanation-${questionNumber}`}
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Explain why this is the correct answer..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit">Save Question</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
