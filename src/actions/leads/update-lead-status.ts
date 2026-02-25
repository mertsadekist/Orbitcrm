"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import type { LeadStatusValue } from "@/types/lead";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatusValue
) {
  const tenant = await getTenant();

  return withErrorHandling(
    "updateLeadStatus",
    async () => {
      assertNotImpersonating(tenant);

      const lead = await prisma.lead.findFirst({
        where: { id: leadId, companyId: tenant.companyId },
      });

      if (!lead) {
        throw new AppError("Lead not found", "NOT_FOUND", 404);
      }

      const oldStatus = lead.status;
      const convertedAt =
        status === "CONVERTED"
          ? new Date()
          : oldStatus === "CONVERTED"
            ? null
            : lead.convertedAt;

      await prisma.$transaction([
        prisma.lead.update({
          where: { id: leadId },
          data: { status, convertedAt },
        }),
        prisma.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "LEAD_STATUS_CHANGE",
            entity: "Lead",
            entityId: leadId,
            oldValues: { status: oldStatus } as unknown as Prisma.InputJsonValue,
            newValues: { status } as unknown as Prisma.InputJsonValue,
          },
        }),
      ]);

      revalidatePath("/leads");
      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
