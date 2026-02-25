"use client";

import type { ImageGridQuestion, QuizResponse } from "@/types/quiz";
import { cn } from "@/lib/utils";

interface ImageGridRendererProps {
  question: ImageGridQuestion;
  response: QuizResponse | undefined;
  error: string | undefined;
  onRespond: (response: QuizResponse) => void;
}

export function ImageGridRenderer({
  question,
  response,
  error,
  onRespond,
}: ImageGridRendererProps) {
  const selectedOptionId = response?.selectedOptionId;
  const columns = question.columns ?? 2;

  function handleSelect(option: (typeof question.options)[number]) {
    onRespond({
      questionId: question.id,
      questionText: question.questionText,
      questionType: "image_grid",
      answer: option.value,
      selectedOptionId: option.id,
    });
  }

  return (
    <div
      className="gap-3"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {question.options.map((option, index) => {
        const isSelected = selectedOptionId === option.id;

        return (
          <button
            key={`${question.id}-${option.id}-${index}`}
            type="button"
            onClick={() => handleSelect(option)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:bg-accent",
              isSelected
                ? "border-2 outline outline-2 outline-offset-2"
                : "border-input"
            )}
            style={
              isSelected
                ? {
                    borderColor: "var(--quiz-primary)",
                    outlineColor: "var(--quiz-primary)",
                  }
                : undefined
            }
          >
            {option.imageUrl && (
              <img
                src={option.imageUrl}
                alt={option.label}
                className="w-full aspect-square object-cover rounded-md"
              />
            )}
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
