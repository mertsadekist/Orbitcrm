"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant } from "@/lib/auth/get-tenant";
import { hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { closeDealSchema } from "@/lib/validators/deal-schema";
import { calculateSplitAmount } from "@/lib/deal-utils";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

export async function closeDeal(input: unknown) {
  const tenant = await getTenant();

  return withErrorHandling(
    "closeDeal",
    async () => {
      if (!hasMinimumRole(tenant.role, "EMPLOYEE")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      const parsed = closeDealSchema.safeParse(input);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.issues[0]?.message ?? "Invalid deal data",
          "VALIDATION_ERROR",
          400
        );
      }

      const data = parsed.data;

      // Verify lead exists, belongs to company, and not already converted
      const lead = await prisma.lead.findFirst({
        where: { id: data.leadId, companyId: tenant.companyId },
      });

      if (!lead) {
        throw new AppError("Lead not found", "NOT_FOUND", 404);
      }

      if (lead.status === "CONVERTED") {
        throw new AppError("Lead is already converted", "CONFLICT", 409);
      }

      // Verify all split user IDs belong to this company
      if (data.splits.length > 0) {
        const userIds = data.splits.map((s) => s.userId);
        const users = await prisma.user.findMany({
          where: {
            id: { in: userIds },
            companyId: tenant.companyId,
            isActive: true,
          },
          select: { id: true },
        });

        if (users.length !== userIds.length) {
          throw new AppError(
            "One or more commission users not found",
            "VALIDATION_ERROR",
            400
          );
        }
      }

      // Double-check splits sum <= 100%
      const totalPct = data.splits.reduce((sum, s) => sum + s.percentage, 0);
      if (totalPct > 100) {
        throw new AppError(
          "Commission splits cannot exceed 100%",
          "VALIDATION_ERROR",
          400
        );
      }

      // Determine assignee: lead's assignee or current user
      const assignedToId = lead.assignedToId ?? tenant.userId;

      // Single transaction: create Deal + Commission rows + update Lead
      const deal = await prisma.$transaction(async (tx) => {
        const newDeal = await tx.deal.create({
          data: {
            companyId: tenant.companyId,
            leadId: data.leadId,
            assignedToId,
            title: data.title,
            value: new Prisma.Decimal(data.value),
            currency: data.currency,
            stage: "CLOSED_WON",
            probability: 100,
            closedAt: new Date(),
          },
        });

        // Create commission rows
        if (data.splits.length > 0) {
          await tx.commission.createMany({
            data: data.splits.map((split) => ({
              companyId: tenant.companyId,
              dealId: newDeal.id,
              userId: split.userId,
              amount: new Prisma.Decimal(
                calculateSplitAmount(data.value, split.percentage)
              ),
              percentage: split.percentage,
              status: "PENDING" as const,
            })),
          });
        }

        // Update lead to CONVERTED
        await tx.lead.update({
          where: { id: data.leadId },
          data: {
            status: "CONVERTED",
            convertedAt: new Date(),
          },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "DEAL_CLOSE",
            entity: "Deal",
            entityId: newDeal.id,
            newValues: {
              title: data.title,
              value: data.value,
              currency: data.currency,
              stage: "CLOSED_WON",
              leadId: data.leadId,
              splitsCount: data.splits.length,
            } as unknown as Prisma.InputJsonValue,
          },
        });

        return newDeal;
      });

      revalidatePath("/leads");
      revalidatePath("/pipeline");
      return { dealId: deal.id };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}