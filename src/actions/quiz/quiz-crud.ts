"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant } from "@/lib/auth/get-tenant";
import { hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { quizConfigSchema } from "@/lib/validators/quiz-schema";
import { createDefaultQuizConfig } from "@/lib/quiz/config-helpers";
import type { QuizConfig } from "@/types/quiz";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

// ─── Types ──────────────────────────────────────────────

export type QuizListItem = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  isActive: boolean;
  primaryColor: string;
  leadCount: number;
  createdAt: string;
  updatedAt: string;
};

export type QuizDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  primaryColor: string;
  backgroundImage: string | null;
  isPublished: boolean;
  isActive: boolean;
  config: QuizConfig;
  companySlug: string;
  createdAt: string;
  updatedAt: string;
};

// ─── List Quizzes ───────────────────────────────────────

export async function getQuizzes() {
  const tenant = await getTenant();

  return withErrorHandling(
    "getQuizzes",
    async () => {
      const quizzes = await prisma.quiz.findMany({
        where: { companyId: tenant.companyId },
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { leads: true } } },
      });

      return quizzes.map(
        (q): QuizListItem => ({
          id: q.id,
          title: q.title,
          slug: q.slug,
          isPublished: q.isPublished,
          isActive: q.isActive,
          primaryColor: q.primaryColor,
          leadCount: q._count.leads,
          createdAt: q.createdAt.toISOString(),
          updatedAt: q.updatedAt.toISOString(),
        })
      );
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}

// ─── Get Quiz By ID ─────────────────────────────────────

export async function getQuizById(quizId: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "getQuizById",
    async () => {
      const quiz = await prisma.quiz.findFirst({
        where: { id: quizId, companyId: tenant.companyId },
        include: { company: { select: { slug: true } } },
      });

      if (!quiz) {
        throw new AppError("Quiz not found", "NOT_FOUND", 404);
      }

      return {
        id: quiz.id,
        title: quiz.title,
        slug: quiz.slug,
        description: quiz.description,
        primaryColor: quiz.primaryColor,
        backgroundImage: quiz.backgroundImage,
        isPublished: quiz.isPublished,
        isActive: quiz.isActive,
        config: quiz.config as unknown as QuizConfig,
        companySlug: quiz.company.slug,
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
      } satisfies QuizDetail;
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}

// ─── Create Quiz ────────────────────────────────────────

export async function createQuiz(title: string, slug: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "createQuiz",
    async () => {
      if (!hasMinimumRole(tenant.role, "MANAGER")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      const normalizedSlug = slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      if (!normalizedSlug) {
        throw new AppError("Invalid slug", "VALIDATION_ERROR", 400);
      }

      const existing = await prisma.quiz.findFirst({
        where: { companyId: tenant.companyId, slug: normalizedSlug },
      });

      if (existing) {
        throw new AppError(
          "A quiz with this slug already exists",
          "CONFLICT",
          409
        );
      }

      const quiz = await prisma.quiz.create({
        data: {
          companyId: tenant.companyId,
          title: title.trim(),
          slug: normalizedSlug,
          config: createDefaultQuizConfig() as unknown as Prisma.InputJsonValue,
        },
      });

      return { id: quiz.id, title: quiz.title, slug: quiz.slug };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}

// ─── Update Quiz Config ─────────────────────────────────

export async function updateQuizConfig(quizId: string, config: QuizConfig) {
  const tenant = await getTenant();

  return withErrorHandling(
    "updateQuizConfig",
    async () => {
      if (!hasMinimumRole(tenant.role, "MANAGER")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      // Validate config
      const result = quizConfigSchema.safeParse(config);
      if (!result.success) {
        const firstError = result.error.issues[0]?.message ?? "Invalid config";
        throw new AppError(firstError, "VALIDATION_ERROR", 400);
      }

      const quiz = await prisma.quiz.findFirst({
        where: { id: quizId, companyId: tenant.companyId },
      });

      if (!quiz) {
        throw new AppError("Quiz not found", "NOT_FOUND", 404);
      }

      await prisma.quiz.update({
        where: { id: quizId },
        data: { config: config as unknown as Prisma.InputJsonValue },
      });

      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}

// ─── Update Quiz Meta ───────────────────────────────────

export async function updateQuizMeta(
  quizId: string,
  data: {
    title?: string;
    slug?: string;
    description?: string;
    primaryColor?: string;
    backgroundImage?: string | null;
  }
) {
  const tenant = await getTenant();

  return withErrorHandling(
    "updateQuizMeta",
    async () => {
      if (!hasMinimumRole(tenant.role, "MANAGER")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      const quiz = await prisma.quiz.findFirst({
        where: { id: quizId, companyId: tenant.companyId },
      });

      if (!quiz) {
        throw new AppError("Quiz not found", "NOT_FOUND", 404);
      }

      if (data.slug && data.slug !== quiz.slug) {
        const existing = await prisma.quiz.findFirst({
          where: { companyId: tenant.companyId, slug: data.slug },
        });
        if (existing) {
          throw new AppError(
            "A quiz with this slug already exists",
            "CONFLICT",
            409
          );
        }
      }

      await prisma.quiz.update({
        where: { id: quizId },
        data: {
          ...(data.title !== undefined && { title: data.title.trim() }),
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.primaryColor !== undefined && {
            primaryColor: data.primaryColor,
          }),
          ...(data.backgroundImage !== undefined && {
            backgroundImage: data.backgroundImage,
          }),
        },
      });

      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}

// ─── Toggle Publish ─────────────────────────────────────

export async function togglePublish(quizId: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "togglePublish",
    async () => {
      if (!hasMinimumRole(tenant.role, "MANAGER")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      const quiz = await prisma.quiz.findFirst({
        where: { id: quizId, companyId: tenant.companyId },
      });

      if (!quiz) {
        throw new AppError("Quiz not found", "NOT_FOUND", 404);
      }

      const config = quiz.config as unknown as QuizConfig;

      // Must have at least 1 question to publish
      if (!quiz.isPublished && config.questions.length === 0) {
        throw new AppError(
          "Cannot publish a quiz with no questions",
          "VALIDATION_ERROR",
          400
        );
      }

      const updated = await prisma.quiz.update({
        where: { id: quizId },
        data: { isPublished: !quiz.isPublished },
      });

      return { isPublished: updated.isPublished };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}

// ─── Delete Quiz ────────────────────────────────────────

export async function deleteQuiz(quizId: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "deleteQuiz",
    async () => {
      if (!hasMinimumRole(tenant.role, "OWNER")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      const quiz = await prisma.quiz.findFirst({
        where: { id: quizId, companyId: tenant.companyId },
      });

      if (!quiz) {
        throw new AppError("Quiz not found", "NOT_FOUND", 404);
      }

      await prisma.quiz.delete({ where: { id: quizId } });
      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
