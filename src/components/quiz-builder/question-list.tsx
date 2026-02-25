"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuestionListItem } from "@/components/quiz-builder/question-list-item";
import { QuestionTypeSelector } from "@/components/quiz-builder/question-type-selector";
import type { QuizQuestion, QuizQuestionType } from "@/types/quiz";

interface QuestionListProps {
  questions: QuizQuestion[];
  selectedId: string | null;
  onSelectQuestion: (id: string) => void;
  onReorder: (questions: QuizQuestion[]) => void;
  onAddQuestion: (type: QuizQuestionType) => void;
  onDeleteQuestion: (id: string) => void;
}

export function QuestionList({
  questions,
  selectedId,
  onSelectQuestion,
  onReorder,
  onAddQuestion,
  onDeleteQuestion,
}: QuestionListProps) {
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    [newQuestions[index - 1], newQuestions[index]] = [
      newQuestions[index],
      newQuestions[index - 1],
    ];
    onReorder(newQuestions);
  };

  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [
      newQuestions[index + 1],
      newQuestions[index],
    ];
    onReorder(newQuestions);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium">Questions</span>
        <Badge variant="secondary">{questions.length}</Badge>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1">
          {questions.map((question, index) => (
            <QuestionListItem
              key={question.id}
              question={question}
              index={index}
              isSelected={question.id === selectedId}
              onSelect={() => onSelectQuestion(question.id)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              onDelete={() => onDeleteQuestion(question.id)}
              isFirst={index === 0}
              isLast={index === questions.length - 1}
            />
          ))}
        </div>
      </ScrollArea>
      <div className="border-t p-3">
        <QuestionTypeSelector onSelect={onAddQuestion} />
      </div>
    </div>
  );
}
