"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { withErrorHandling, AppError } from "@/lib/logger";
import { quizSubmissionSchema } from "@/lib/validators/quiz-schema";
import { validateSubmissionResponses } from "@/lib/quiz/validation";
import { extractContactInfo, normalizePhone } from "@/lib/quiz/extraction";
import { calculateLeadScore } from "@/lib/quiz/scoring";
import type { QuizConfig, QuizSubmissionData, QuizResponse } from "@/types/quiz";

export async function submitQuiz(data: QuizSubmissionData) {
  return withErrorHandling("submitQuiz", async () => {
    // 1. Zod validate
    const parsed = quizSubmissionSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError("Invalid submission data", "VALIDATION_ERROR", 400);
    }

    // 2. Fetch quiz
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: data.quizId,
        isPublished: true,
        isActive: true,
      },
      include: {
        company: { select: { id: true, isActive: true, slug: true } },
      },
    });

    if (!quiz || !quiz.company.isActive) {
      throw new AppError("Quiz not available", "NOT_FOUND", 404);
    }

    const config = quiz.config as unknown as QuizConfig;

    // 3. Validate responses
    const errors = validateSubmissionResponses(config, data.responses);
    if (errors.size > 0) {
      const firstError = errors.values().next().value;
      throw new AppError(
        firstError ?? "Validation failed",
        "VALIDATION_ERROR",
        400,
      );
    }

    // 4. Extract contact info
    const contactInfo = extractContactInfo(config.questions, data.responses);

    // 5. Calculate score
    const score = calculateLeadScore(config, data.responses);

    // 6. Serialize responses for storage
    const serializedResponses = data.responses.map((r) => ({
      questionId: r.questionId,
      questionText: r.questionText,
      questionType: r.questionType,
      answer: r.answer,
      selectedOptionId: r.selectedOptionId,
    }));

    // 7. Duplicate detection by companyId + phone
    if (contactInfo.phone) {
      const normalized = normalizePhone(contactInfo.phone);
      const existing = await prisma.lead.findFirst({
        where: {
          companyId: quiz.company.id,
          phone: normalized,
        },
      });

      if (existing) {
        // Merge: append responses, keep max score
        const existingResponses = Array.isArray(existing.quizResponses)
          ? (existing.quizResponses as unknown as QuizResponse[])
          : [];

        await prisma.lead.update({
          where: { id: existing.id },
          data: {
            quizId: quiz.id,
            quizResponses: [
              ...existingResponses,
              ...serializedResponses,
            ] as unknown as Prisma.InputJsonValue,
            score: Math.max(existing.score ?? 0, score),
            ...(contactInfo.firstName && { firstName: contactInfo.firstName }),
            ...(contactInfo.lastName && { lastName: contactInfo.lastName }),
            ...(contactInfo.email && { email: contactInfo.email }),
            phone: normalized,
          },
        });

        return { leadId: existing.id };
      }
    }

    // 8. Create new lead
    const lead = await prisma.lead.create({
      data: {
        companyId: quiz.company.id,
        quizId: quiz.id,
        firstName: contactInfo.firstName ?? null,
        lastName: contactInfo.lastName ?? null,
        email: contactInfo.email ?? null,
        phone: contactInfo.phone ? normalizePhone(contactInfo.phone) : null,
        source: "quiz",
        status: "NEW",
        quizResponses: serializedResponses as unknown as Prisma.InputJsonValue,
        score,
      },
    });

    return { leadId: lead.id };
  });
}
