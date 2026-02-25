"use client";

import type { TextQuestion, QuizResponse } from "@/types/quiz";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TextRendererProps {
  question: TextQuestion;
  response: QuizResponse | undefined;
  error: string | undefined;
  onRespond: (response: QuizResponse) => void;
}

export function TextRenderer({
  question,
  response,
  error,
  onRespond,
}: TextRendererProps) {
  const value = (response?.answer as string) ?? "";

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    onRespond({
      questionId: question.id,
      questionText: question.questionText,
      questionType: "text",
      answer: e.target.value,
    });
  }

  if (question.multiline) {
    return (
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder={question.placeholder}
        maxLength={question.maxLength}
        aria-invalid={!!error}
      />
    );
  }

  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={question.placeholder}
      maxLength={question.maxLength}
      aria-invalid={!!error}
    />
  );
}
