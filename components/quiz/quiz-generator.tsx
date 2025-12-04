'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QuizGeneratorProps {
  onGenerate: (config: GenerateConfig) => Promise<void>;
  contentItems?: Array<{ id: string; title: string }>;
}

export interface GenerateConfig {
  contentIds: string[];
  questionCount: number;
  questionTypes: string[];
}

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True/False' },
  { value: 'short_answer', label: 'Short Answer' },
];

export function QuizGenerator({ onGenerate, contentItems = [] }: QuizGeneratorProps) {
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['multiple_choice', 'true_false']);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleGenerate = async () => {
    if (selectedContent.length === 0 || selectedTypes.length === 0) {
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerate({
        contentIds: selectedContent,
        questionCount,
        questionTypes: selectedTypes,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedContent.length === contentItems.length) {
      setSelectedContent([]);
    } else {
      setSelectedContent(contentItems.map((item) => item.id));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Quiz Generator
        </CardTitle>
        <CardDescription>
          Select content and configure quiz generation settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Select Content</Label>
            {contentItems.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedContent.length === contentItems.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
          {contentItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No content items available in this subcategory
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-4">
              {contentItems.map((item) => (
                <div key={item.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={item.id}
                    checked={selectedContent.includes(item.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedContent([...selectedContent, item.id]);
                      } else {
                        setSelectedContent(selectedContent.filter((id) => id !== item.id));
                      }
                    }}
                  />
                  <Label
                    htmlFor={item.id}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {item.title}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="questionCount">Number of Questions</Label>
          <Input
            id="questionCount"
            type="number"
            min={1}
            max={50}
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
          />
        </div>

        <div className="space-y-3">
          <Label>Question Types</Label>
          <div className="space-y-2">
            {QUESTION_TYPES.map((type) => (
              <div key={type.value} className="flex items-start space-x-3">
                <Checkbox
                  id={type.value}
                  checked={selectedTypes.includes(type.value)}
                  onCheckedChange={() => handleTypeToggle(type.value)}
                />
                <Label
                  htmlFor={type.value}
                  className="text-sm font-normal cursor-pointer"
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || selectedContent.length === 0 || selectedTypes.length === 0}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Quiz...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Quiz
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
