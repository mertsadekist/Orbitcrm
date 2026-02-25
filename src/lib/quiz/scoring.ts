import type { QuizConfig, QuizQuestion, QuizResponse } from "@/types/quiz";

export function calculateLeadScore(
  config: QuizConfig,
  responses: QuizResponse[]
): number {
  const questionMap = new Map<string, QuizQuestion>();
  for (const q of config.questions) {
    questionMap.set(q.id, q);
  }

  let earned = 0;
  let max = 0;

  for (const response of responses) {
    const question = questionMap.get(response.questionId);
    if (!question) continue;

    const w = question.weight;

    if (question.type === "radio" || question.type === "image_grid") {
      max += w * 10;
      const selectedValue = String(response.answer ?? "");
      const option = question.options.find(
        (o) =>
          o.id === response.selectedOptionId || o.value === selectedValue
      );
      if (option) {
        earned += w * option.score;
      }
    } else {
      // text, email, phone, name — binary scoring
      max += w * 1;
      if (isAnswered(response.answer)) {
        earned += w * 1;
      }
    }
  }

  if (max === 0) return 0;
  return Math.round((earned / max) * 100);
}

function isAnswered(answer: unknown): boolean {
  if (answer == null) return false;
  if (typeof answer === "string") return answer.trim().length > 0;
  if (typeof answer === "object") {
    // name type: { firstName, lastName }
    const obj = answer as Record<string, unknown>;
    return Object.values(obj).some(
      (v) => typeof v === "string" && v.trim().length > 0
    );
  }
  return true;
}
