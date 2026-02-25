"use client";

import type {
  QuizQuestion,
  QuizResponse,
  RadioQuestion,
  ImageGridQuestion,
} from "@/types/quiz";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuizSummaryStepProps {
  questions: QuizQuestion[];
  responses: Map<string, QuizResponse>;
  onEdit: (stepIndex: number) => void;
}

export function QuizSummaryStep({
  questions,
  responses,
  onEdit,
}: QuizSummaryStepProps) {
  function getDisplayAnswer(
    question: QuizQuestion,
    response: QuizResponse | undefined
  ): string {
    if (!response) return "Not answered";

    if (
      (question.type === "radio" || question.type === "image_grid") &&
      response.selectedOptionId
    ) {
      const q = question as RadioQuestion | ImageGridQuestion;
      const option = q.options.find(
        (o) => o.id === response.selectedOptionId
      );
      return option?.label ?? String(response.answer ?? "Not answered");
    }

    if (typeof response.answer === "object" && response.answer !== null) {
      const nameAnswer = response.answer as {
        firstName?: string;
        lastName?: string;
      };
      return [nameAnswer.firstName, nameAnswer.lastName]
        .filter(Boolean)
        .join(" ") || "Not answered";
    }

    return String(response.answer ?? "Not answered");
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      <h3 className="text-lg font-semibold">Review Your Answers</h3>

      {questions.map((question, index) => {
        const response = responses.get(question.id);
        return (
          <Card key={question.id}>
            <CardContent className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{question.questionText}</p>
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {getDisplayAnswer(question, response)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(index)}
              >
                Edit
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
