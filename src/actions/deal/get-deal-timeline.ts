"use server";

import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";

export async function getDealTimeline(dealId: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "getDealTimeline",
    async () => {
      const deal = await prisma.deal.findFirst({
        where: { id: dealId, companyId: tenant.companyId },
      });
      if (!deal) {
        throw new AppError("Deal not found", "NOT_FOUND", 404);
      }

      const entries = await prisma.auditLog.findMany({
        where: {
          entity: "Deal",
          entityId: dealId,
          companyId: tenant.companyId,
        },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      return entries.map((entry) => ({
        id: entry.id,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        oldValues: entry.oldValues as Record<string, unknown> | null,
        newValues: entry.newValues as Record<string, unknown> | null,
        userId: entry.userId,
        user: entry.user,
        createdAt: entry.createdAt.toISOString(),
      }));
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
