"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant } from "@/lib/auth/get-tenant";
import { hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { getProbabilityForStage } from "@/lib/deal-utils";
import type { DealStageValue } from "@/types/deal";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";
export async function updateDealStage(dealId: string, newStage: DealStageValue) {
  const tenant = await getTenant();
  return withErrorHandling(
    "updateDealStage",
    async () => {
      if (!hasMinimumRole(tenant.role, "EMPLOYEE")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }
      assertNotImpersonating(tenant);
      const deal = await prisma.deal.findFirst({
        where: { id: dealId, companyId: tenant.companyId },
      });
      if (!deal) {
        throw new AppError("Deal not found", "NOT_FOUND", 404);
      }
      // Cannot move out of CLOSED_WON or CLOSED_LOST
      if (deal.stage === "CLOSED_WON" || deal.stage === "CLOSED_LOST") {
        throw new AppError(
          "Cannot change stage of a closed deal",
          "VALIDATION_ERROR",
          400
        );
      }
      // Moving to CLOSED_WON requires the close deal modal
      if (newStage === "CLOSED_WON") {
        return { requiresModal: true as const };
      }
      const oldStage = deal.stage;
      const probability = getProbabilityForStage(newStage);
      const closedAt = newStage === "CLOSED_LOST" ? new Date() : null;
      await prisma.$transaction([
        prisma.deal.update({
          where: { id: dealId },
          data: {
            stage: newStage,
            probability,
            closedAt,
          },
        }),
        prisma.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "DEAL_STAGE_CHANGE",
            entity: "Deal",
            entityId: dealId,
            oldValues: { stage: oldStage } as unknown as Prisma.InputJsonValue,
            newValues: { stage: newStage, probability } as unknown as Prisma.InputJsonValue,
          },
        }),
      ]);
      revalidatePath("/pipeline");
      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}