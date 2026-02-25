"use client";

import type { RadioQuestion, QuizResponse } from "@/types/quiz";
import { cn } from "@/lib/utils";

interface RadioRendererProps {
  question: RadioQuestion;
  response: QuizResponse | undefined;
  error: string | undefined;
  onRespond: (response: QuizResponse) => void;
}

export function RadioRenderer({
  question,
  response,
  error,
  onRespond,
}: RadioRendererProps) {
  const selectedOptionId = response?.selectedOptionId;
  const layout = question.layout ?? "vertical";

  function handleSelect(option: (typeof question.options)[number]) {
    onRespond({
      questionId: question.id,
      questionText: question.questionText,
      questionType: "radio",
      answer: option.value,
      selectedOptionId: option.id,
    });
  }

  return (
    <div
      className={cn(
        layout === "vertical" && "flex flex-col gap-2",
        layout === "horizontal" && "flex flex-row flex-wrap gap-2",
        layout === "cards" && "grid grid-cols-2 gap-2"
      )}
    >
      {question.options.map((option, index) => {
        const isSelected = selectedOptionId === option.id;

        return (
          <button
            key={`${question.id}-${option.id}-${index}`}
            type="button"
            onClick={() => handleSelect(option)}
            className={cn(
              "rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-accent",
              "flex items-center gap-2",
              isSelected ? "border-2" : "border",
              !isSelected && "border-input"
            )}
            style={
              isSelected
                ? { borderColor: "var(--quiz-primary)" }
                : undefined
            }
          >
            {option.icon && (
              <span className="text-xl shrink-0">{option.icon}</span>
            )}
            <span className="flex-1">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
