"use client";

import type { NameQuestion, QuizResponse } from "@/types/quiz";
import { Input } from "@/components/ui/input";

interface NameRendererProps {
  question: NameQuestion;
  response: QuizResponse | undefined;
  error: string | undefined;
  onRespond: (response: QuizResponse) => void;
}

export function NameRenderer({
  question,
  response,
  error,
  onRespond,
}: NameRendererProps) {
  const currentAnswer = (response?.answer as { firstName?: string; lastName?: string }) ?? {
    firstName: "",
    lastName: "",
  };

  function handleChange(field: "firstName" | "lastName", value: string) {
    const updated = { ...currentAnswer, [field]: value };
    onRespond({
      questionId: question.id,
      questionText: question.questionText,
      questionType: "name",
      answer: updated,
    });
  }

  return (
    <div className="flex gap-3">
      <Input
        type="text"
        value={currentAnswer.firstName ?? ""}
        onChange={(e) => handleChange("firstName", e.target.value)}
        placeholder={question.firstNamePlaceholder ?? "First name"}
        aria-invalid={!!error}
      />
      <Input
        type="text"
        value={currentAnswer.lastName ?? ""}
        onChange={(e) => handleChange("lastName", e.target.value)}
        placeholder={question.lastNamePlaceholder ?? "Last name"}
        aria-invalid={!!error}
      />
    </div>
  );
}
