'use client';

import { QuizQuestion } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QuizQuestionProps {
  question: QuizQuestion;
  questionNumber: number;
  selectedAnswer?: string;
  onAnswerChange?: (answer: string) => void;
  showCorrectAnswer?: boolean;
  userAnswer?: string;
  disabled?: boolean;
}

export function QuizQuestionComponent({
  question,
  questionNumber,
  selectedAnswer,
  onAnswerChange,
  showCorrectAnswer = false,
  userAnswer,
  disabled = false,
}: QuizQuestionProps) {
  const isCorrect = showCorrectAnswer && userAnswer === question.correct_answer;
  const isWrong = showCorrectAnswer && userAnswer !== undefined && userAnswer !== question.correct_answer;

  return (
    <Card className={showCorrectAnswer ? (isCorrect ? 'border-green-500' : isWrong ? 'border-red-500' : '') : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-medium flex-1">
            <span className="text-muted-foreground mr-2">Q{questionNumber}.</span>
            {question.question_text}
          </CardTitle>
          {showCorrectAnswer && (
            <div className="ml-2">
              {isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : isWrong ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : null}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="capitalize">{question.question_type.replace('_', ' ')}</span>
          <span>•</span>
          <span>{question.points} {question.points === 1 ? 'point' : 'points'}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {question.question_type === 'multiple_choice' && question.options && (
          <RadioGroup
            value={selectedAnswer}
            onValueChange={onAnswerChange}
            disabled={disabled}
            className="space-y-3"
          >
            {question.options.map((option, index) => {
              const isThisCorrect = showCorrectAnswer && option === question.correct_answer;
              const isThisSelected = userAnswer === option;

              return (
                <div
                  key={index}
                  className={`flex items-start space-x-3 rounded-md border p-4 ${
                    showCorrectAnswer && isThisCorrect
                      ? 'border-green-500 bg-green-50'
                      : showCorrectAnswer && isThisSelected && !isThisCorrect
                      ? 'border-red-500 bg-red-50'
                      : ''
                  }`}
                >
                  <RadioGroupItem value={option} id={`q${question.id}-${index}`} />
                  <Label
                    htmlFor={`q${question.id}-${index}`}
                    className="flex-1 cursor-pointer font-normal leading-relaxed"
                  >
                    {option}
                    {showCorrectAnswer && isThisCorrect && (
                      <span className="ml-2 text-green-600 font-medium">(Correct)</span>
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        )}

        {question.question_type === 'true_false' && (
          <RadioGroup
            value={selectedAnswer}
            onValueChange={onAnswerChange}
            disabled={disabled}
            className="space-y-3"
          >
            {['True', 'False'].map((option) => {
              const isThisCorrect = showCorrectAnswer && option === question.correct_answer;
              const isThisSelected = userAnswer === option;

              return (
                <div
                  key={option}
                  className={`flex items-start space-x-3 rounded-md border p-4 ${
                    showCorrectAnswer && isThisCorrect
                      ? 'border-green-500 bg-green-50'
                      : showCorrectAnswer && isThisSelected && !isThisCorrect
                      ? 'border-red-500 bg-red-50'
                      : ''
                  }`}
                >
                  <RadioGroupItem value={option} id={`q${question.id}-${option}`} />
                  <Label
                    htmlFor={`q${question.id}-${option}`}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {option}
                    {showCorrectAnswer && isThisCorrect && (
                      <span className="ml-2 text-green-600 font-medium">(Correct)</span>
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        )}

        {question.question_type === 'short_answer' && (
          <div className="space-y-2">
            <Textarea
              value={selectedAnswer || ''}
              onChange={(e) => onAnswerChange?.(e.target.value)}
              disabled={disabled}
              placeholder="Type your answer here..."
              rows={3}
              className={
                showCorrectAnswer
                  ? isCorrect
                    ? 'border-green-500'
                    : isWrong
                    ? 'border-red-500'
                    : ''
                  : ''
              }
            />
            {showCorrectAnswer && (
              <div className="text-sm">
                <p className="font-medium text-green-600">Correct answer:</p>
                <p className="text-muted-foreground mt-1">{question.correct_answer}</p>
              </div>
            )}
          </div>
        )}

        {showCorrectAnswer && question.explanation && (
          <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
            <p className="text-sm text-blue-800">{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
