import type { QuizConfig, QuizQuestion, QuizResponse } from "@/types/quiz";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

export function validateSubmissionResponses(
  config: QuizConfig,
  responses: QuizResponse[]
): Map<string, string> {
  const errors = new Map<string, string>();
  const responseMap = new Map<string, QuizResponse>();
  for (const r of responses) {
    responseMap.set(r.questionId, r);
  }

  for (const question of config.questions) {
    const response = responseMap.get(question.id);
    const answer = response?.answer;

    // Required check
    if (question.required && !hasAnswer(answer)) {
      errors.set(question.id, "This question is required");
      continue;
    }

    // Skip format checks if not answered and not required
    if (!hasAnswer(answer)) continue;

    // Type-specific validation
    switch (question.type) {
      case "email":
        if (typeof answer === "string" && !EMAIL_REGEX.test(answer.trim())) {
          errors.set(question.id, "Please enter a valid email address");
        }
        break;

      case "phone":
        if (typeof answer === "string" && !PHONE_REGEX.test(answer.trim())) {
          errors.set(question.id, "Please enter a valid phone number");
        }
        break;

      case "name":
        if (!validateNameAnswer(answer)) {
          errors.set(question.id, "Please enter your first and last name");
        }
        break;

      case "radio":
      case "image_grid":
        if (!validateOptionAnswer(question, answer)) {
          errors.set(question.id, "Please select a valid option");
        }
        break;
    }
  }

  return errors;
}

function hasAnswer(answer: unknown): boolean {
  if (answer == null) return false;
  if (typeof answer === "string") return answer.trim().length > 0;
  if (typeof answer === "object") {
    return Object.values(answer as Record<string, unknown>).some(
      (v) => typeof v === "string" && v.trim().length > 0
    );
  }
  return true;
}

function validateNameAnswer(answer: unknown): boolean {
  if (typeof answer === "object" && answer != null) {
    const obj = answer as Record<string, unknown>;
    return (
      typeof obj.firstName === "string" &&
      obj.firstName.trim().length > 0 &&
      typeof obj.lastName === "string" &&
      obj.lastName.trim().length > 0
    );
  }
  if (typeof answer === "string") {
    const parts = answer.trim().split(/\s+/);
    return parts.length >= 2 && parts[0].length > 0;
  }
  return false;
}

function validateOptionAnswer(
  question: { type: "radio" | "image_grid"; options: { value: string }[] },
  answer: unknown
): boolean {
  if (typeof answer !== "string") return false;
  return question.options.some((o) => o.value === answer);
}
