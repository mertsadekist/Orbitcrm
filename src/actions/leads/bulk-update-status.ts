"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant, hasMinimumRole } from "@/lib/auth/get-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import { withErrorHandling, AppError } from "@/lib/logger";
import type { LeadStatusValue } from "@/types/lead";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

export async function bulkUpdateStatus(
  leadIds: string[],
  status: LeadStatusValue
) {
  const tenant = await getTenant();

  return withErrorHandling(
    "bulkUpdateStatus",
    async () => {
      if (
        !hasMinimumRole(tenant.role, "MANAGER") ||
        !hasPermission(tenant.role, tenant.permissions, "canBulkActions")
      ) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      const leads = await prisma.lead.findMany({
        where: { id: { in: leadIds }, companyId: tenant.companyId },
      });
      if (leads.length !== leadIds.length) {
        throw new AppError("One or more leads not found", "NOT_FOUND", 404);
      }

      const operations = leads.flatMap((lead) => {
        const convertedAt =
          status === "CONVERTED"
            ? new Date()
            : lead.status === "CONVERTED"
              ? null
              : lead.convertedAt;

        return [
          prisma.lead.update({
            where: { id: lead.id },
            data: { status, convertedAt },
          }),
          prisma.auditLog.create({
            data: {
              companyId: tenant.companyId,
              userId: tenant.userId,
              action: "LEAD_STATUS_CHANGE",
              entity: "Lead",
              entityId: lead.id,
              oldValues: { status: lead.status } as unknown as Prisma.InputJsonValue,
              newValues: { status } as unknown as Prisma.InputJsonValue,
            },
          }),
        ];
      });

      await prisma.$transaction(operations);

      revalidatePath("/leads");
      return { updated: leadIds.length };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
