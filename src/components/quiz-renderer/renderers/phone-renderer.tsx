"use client";

import type { PhoneQuestion, QuizResponse } from "@/types/quiz";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PhoneRendererProps {
  question: PhoneQuestion;
  response: QuizResponse | undefined;
  error: string | undefined;
  onRespond: (response: QuizResponse) => void;
}

export function PhoneRenderer({
  question,
  response,
  error,
  onRespond,
}: PhoneRendererProps) {
  const value = (response?.answer as string) ?? "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onRespond({
      questionId: question.id,
      questionText: question.questionText,
      questionType: "phone",
      answer: e.target.value,
    });
  }

  return (
    <div className="flex items-center gap-2">
      {question.countryCode && (
        <Label className="text-sm text-muted-foreground shrink-0">
          {question.countryCode}
        </Label>
      )}
      <Input
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder={question.placeholder ?? "Phone number"}
        aria-invalid={!!error}
      />
    </div>
  );
}
