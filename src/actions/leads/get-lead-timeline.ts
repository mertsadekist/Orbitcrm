"use server";

import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";

export async function getLeadTimeline(leadId: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "getLeadTimeline",
    async () => {
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, companyId: tenant.companyId },
      });
      if (!lead) {
        throw new AppError("Lead not found", "NOT_FOUND", 404);
      }

      const entries = await prisma.auditLog.findMany({
        where: {
          entity: "Lead",
          entityId: leadId,
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
        oldValues: entry.oldValues,
        newValues: entry.newValues,
        userId: entry.userId,
        userName: entry.user
          ? `${entry.user.firstName} ${entry.user.lastName}`
          : null,
        createdAt: entry.createdAt.toISOString(),
      }));
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
