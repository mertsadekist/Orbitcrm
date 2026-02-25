"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

export async function assignLead(
  leadId: string,
  assignedToId: string | null
) {
  const tenant = await getTenant();

  return withErrorHandling(
    "assignLead",
    async () => {
      assertNotImpersonating(tenant);

      const lead = await prisma.lead.findFirst({
        where: { id: leadId, companyId: tenant.companyId },
      });
      if (!lead) {
        throw new AppError("Lead not found", "NOT_FOUND", 404);
      }

      if (assignedToId) {
        const user = await prisma.user.findFirst({
          where: {
            id: assignedToId,
            companyId: tenant.companyId,
            isActive: true,
          },
        });
        if (!user) {
          throw new AppError("User not found in company", "VALIDATION_ERROR", 400);
        }
      }

      await prisma.$transaction([
        prisma.lead.update({
          where: { id: leadId },
          data: { assignedToId },
        }),
        prisma.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "LEAD_ASSIGN",
            entity: "Lead",
            entityId: leadId,
            oldValues: { assignedToId: lead.assignedToId } as unknown as Prisma.InputJsonValue,
            newValues: { assignedToId } as unknown as Prisma.InputJsonValue,
          },
        }),
      ]);

      revalidatePath("/leads");
      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
