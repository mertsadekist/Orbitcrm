"use client";

import type { EmailQuestion, QuizResponse } from "@/types/quiz";
import { Input } from "@/components/ui/input";

interface EmailRendererProps {
  question: EmailQuestion;
  response: QuizResponse | undefined;
  error: string | undefined;
  onRespond: (response: QuizResponse) => void;
}

export function EmailRenderer({
  question,
  response,
  error,
  onRespond,
}: EmailRendererProps) {
  const value = (response?.answer as string) ?? "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onRespond({
      questionId: question.id,
      questionText: question.questionText,
      questionType: "email",
      answer: e.target.value,
    });
  }

  return (
    <Input
      type="email"
      value={value}
      onChange={handleChange}
      placeholder={question.placeholder ?? "you@example.com"}
      aria-invalid={!!error}
    />
  );
}
