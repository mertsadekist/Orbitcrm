"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";

// ─── Schema ─────────────────────────────────────────────

const updateQuotasSchema = z.object({
  maxUsers: z.number().int().min(1).max(1000).optional(),
  maxQuizzes: z.number().int().min(1).max(1000).optional(),
  plan: z.enum(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"]).optional(),
});

export type UpdateCompanyQuotasInput = z.infer<typeof updateQuotasSchema>;

// ─── Action ─────────────────────────────────────────────

export async function updateCompanyQuotas(companyId: string, input: unknown) {
  const tenant = await getTenant();

  return withErrorHandling(
    "updateCompanyQuotas",
    async () => {
      if (tenant.role !== "SUPER_ADMIN") {
        throw new AppError("Access denied", "FORBIDDEN", 403);
      }

      const parsed = updateQuotasSchema.safeParse(input);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.issues[0]?.message ?? "Invalid quota data",
          "VALIDATION_ERROR",
          400
        );
      }

      const data = parsed.data;

      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new AppError("Company not found", "NOT_FOUND", 404);
      }

      // Validate maxUsers against current user count
      if (data.maxUsers !== undefined) {
        const currentUserCount = await prisma.user.count({
          where: { companyId },
        });
        if (data.maxUsers < currentUserCount) {
          throw new AppError(
            "Cannot set maxUsers to " + data.maxUsers + " — company currently has " + currentUserCount + " users",
            "VALIDATION_ERROR",
            400
          );
        }
      }

      // Validate maxQuizzes against current quiz count
      if (data.maxQuizzes !== undefined) {
        const currentQuizCount = await prisma.quiz.count({
          where: { companyId },
        });
        if (data.maxQuizzes < currentQuizCount) {
          throw new AppError(
            "Cannot set maxQuizzes to " + data.maxQuizzes + " — company currently has " + currentQuizCount + " quizzes",
            "VALIDATION_ERROR",
            400
          );
        }
      }

      // Build old/new values for audit
      const oldValues: Record<string, unknown> = {};
      const newValues: Record<string, unknown> = {};

      if (data.maxUsers !== undefined && data.maxUsers !== company.maxUsers) {
        oldValues.maxUsers = company.maxUsers;
        newValues.maxUsers = data.maxUsers;
      }
      if (data.maxQuizzes !== undefined && data.maxQuizzes !== company.maxQuizzes) {
        oldValues.maxQuizzes = company.maxQuizzes;
        newValues.maxQuizzes = data.maxQuizzes;
      }
      if (data.plan !== undefined && data.plan !== company.plan) {
        oldValues.plan = company.plan;
        newValues.plan = data.plan;
      }

      await prisma.$transaction(async (tx) => {
        await tx.company.update({
          where: { id: companyId },
          data: {
            ...(data.maxUsers !== undefined && { maxUsers: data.maxUsers }),
            ...(data.maxQuizzes !== undefined && { maxQuizzes: data.maxQuizzes }),
            ...(data.plan !== undefined && { plan: data.plan }),
          },
        });

        await tx.auditLog.create({
          data: {
            companyId,
            userId: tenant.userId,
            action: "UPDATE_COMPANY_QUOTAS",
            entity: "Company",
            entityId: companyId,
            oldValues: oldValues as unknown as Prisma.InputJsonValue,
            newValues: newValues as unknown as Prisma.InputJsonValue,
          },
        });
      });

      revalidatePath("/super-admin/companies");
      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
