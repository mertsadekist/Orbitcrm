import type {
  QuizQuestion,
  QuizResponse,
  ExtractedContactInfo,
} from "@/types/quiz";

export function extractContactInfo(
  questions: QuizQuestion[],
  responses: QuizResponse[]
): ExtractedContactInfo {
  const questionMap = new Map<string, QuizQuestion>();
  for (const q of questions) {
    questionMap.set(q.id, q);
  }

  const info: ExtractedContactInfo = {};

  for (const response of responses) {
    const question = questionMap.get(response.questionId);
    if (!question) continue;

    switch (question.type) {
      case "email":
        if (typeof response.answer === "string" && response.answer.trim()) {
          info.email = response.answer.trim().toLowerCase();
        }
        break;

      case "phone":
        if (typeof response.answer === "string" && response.answer.trim()) {
          info.phone = normalizePhone(response.answer);
        }
        break;

      case "name":
        if (typeof response.answer === "object" && response.answer != null) {
          const nameObj = response.answer as Record<string, unknown>;
          if (typeof nameObj.firstName === "string")
            info.firstName = nameObj.firstName.trim();
          if (typeof nameObj.lastName === "string")
            info.lastName = nameObj.lastName.trim();
        } else if (typeof response.answer === "string") {
          const parts = response.answer.trim().split(/\s+/);
          info.firstName = parts[0] ?? "";
          info.lastName = parts.slice(1).join(" ");
        }
        break;
    }
  }

  return info;
}

export function normalizePhone(raw: string): string {
  let phone = raw.trim().replace(/[\s\-()]/g, "");
  if (phone.length > 0 && !phone.startsWith("+") && /^\d/.test(phone)) {
    phone = "+" + phone;
  }
  return phone;
}
