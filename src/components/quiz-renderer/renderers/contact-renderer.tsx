"use client";

import type { ContactQuestion, QuizResponse } from "@/types/quiz";
import { Input } from "@/components/ui/input";

interface ContactRendererProps {
  question: ContactQuestion;
  response: QuizResponse | undefined;
  error: string | undefined;
  onRespond: (response: QuizResponse) => void;
}

export function ContactRenderer({
  question,
  response,
  error,
  onRespond,
}: ContactRendererProps) {
  const currentAnswer = (response?.answer as {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }) ?? {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  };

  function handleChange(
    field: "firstName" | "lastName" | "email" | "phone",
    value: string
  ) {
    const updated = { ...currentAnswer, [field]: value };
    onRespond({
      questionId: question.id,
      questionText: question.questionText,
      questionType: "contact",
      answer: updated,
    });
  }

  return (
    <div className="space-y-3">
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
      <Input
        type="email"
        value={currentAnswer.email ?? ""}
        onChange={(e) => handleChange("email", e.target.value)}
        placeholder={question.emailPlaceholder ?? "you@company.com"}
        aria-invalid={!!error}
      />
      <Input
        type="tel"
        value={currentAnswer.phone ?? ""}
        onChange={(e) => handleChange("phone", e.target.value)}
        placeholder={question.phonePlaceholder ?? "+1234567890"}
        aria-invalid={!!error}
      />
    </div>
  );
}
