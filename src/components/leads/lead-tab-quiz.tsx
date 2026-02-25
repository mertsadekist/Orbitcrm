"use client";

import { FileQuestion } from "lucide-react";

type QuizResponse = {
  questionId: string;
  questionText: string;
  questionType: string;
  answer: unknown;
  selectedOptionId?: string;
};

type LeadTabQuizProps = {
  quizResponses: unknown;
};

function formatAnswer(answer: unknown): string {
  if (answer === null || answer === undefined) {
    return "No answer";
  }

  // Name-type answer with firstName/lastName
  if (
    typeof answer === "object" &&
    answer !== null &&
    "firstName" in answer &&
    "lastName" in answer
  ) {
    const nameObj = answer as { firstName?: string; lastName?: string };
    const first = nameObj.firstName ?? "";
    const last = nameObj.lastName ?? "";
    const full = `${first} ${last}`.trim();
    return full || "No answer";
  }

  if (typeof answer === "string") {
    return answer || "No answer";
  }

  if (typeof answer === "number" || typeof answer === "boolean") {
    return String(answer);
  }

  if (Array.isArray(answer)) {
    return answer.join(", ") || "No answer";
  }

  // Fallback for complex objects
  try {
    return JSON.stringify(answer);
  } catch {
    return "No answer";
  }
}

export function LeadTabQuiz({ quizResponses }: LeadTabQuizProps) {
  if (!quizResponses) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <FileQuestion className="mb-2 h-8 w-8" />
        <p className="text-sm">No quiz responses recorded</p>
      </div>
    );
  }

  let responses: QuizResponse[] = [];

  try {
    if (Array.isArray(quizResponses)) {
      responses = quizResponses as QuizResponse[];
    } else if (typeof quizResponses === "string") {
      responses = JSON.parse(quizResponses) as QuizResponse[];
    }
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <FileQuestion className="mb-2 h-8 w-8" />
        <p className="text-sm">Unable to parse quiz responses</p>
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <FileQuestion className="mb-2 h-8 w-8" />
        <p className="text-sm">No quiz responses recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {responses.map((response, index) => (
        <div
          key={response.questionId ?? index}
          className="rounded-lg border p-3 space-y-1"
        >
          <p className="text-sm font-medium text-foreground">
            {response.questionText}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatAnswer(response.answer)}
          </p>
        </div>
      ))}
    </div>
  );
}
