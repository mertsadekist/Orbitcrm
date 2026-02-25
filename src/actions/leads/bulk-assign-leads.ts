"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant, hasMinimumRole } from "@/lib/auth/get-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import { withErrorHandling, AppError } from "@/lib/logger";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

export async function bulkAssignLeads(
  leadIds: string[],
  assignedToId: string | null
) {
  const tenant = await getTenant();

  return withErrorHandling(
    "bulkAssignLeads",
    async () => {
      if (
        !hasMinimumRole(tenant.role, "MANAGER") ||
        !hasPermission(tenant.role, tenant.permissions, "canBulkActions")
      ) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      const count = await prisma.lead.count({
        where: { id: { in: leadIds }, companyId: tenant.companyId },
      });
      if (count !== leadIds.length) {
        throw new AppError("One or more leads not found", "NOT_FOUND", 404);
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
        prisma.lead.updateMany({
          where: { id: { in: leadIds }, companyId: tenant.companyId },
          data: { assignedToId },
        }),
        ...leadIds.map((leadId) =>
          prisma.auditLog.create({
            data: {
              companyId: tenant.companyId,
              userId: tenant.userId,
              action: "LEAD_ASSIGN",
              entity: "Lead",
              entityId: leadId,
              newValues: { assignedToId } as unknown as Prisma.InputJsonValue,
            },
          })
        ),
      ]);

      revalidatePath("/leads");
      return { updated: leadIds.length };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
