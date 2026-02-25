"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant, hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

export async function toggleUserStatus(userId: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "toggleUserStatus",
    async () => {
      if (!hasMinimumRole(tenant.role, "OWNER")) {
        throw new AppError("Only owners can toggle user status", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      if (userId === tenant.userId) {
        throw new AppError("Cannot deactivate your own account", "CONFLICT", 409);
      }

      const target = await prisma.user.findFirst({
        where: { id: userId, companyId: tenant.companyId },
      });

      if (!target) {
        throw new AppError("User not found", "NOT_FOUND", 404);
      }

      const newStatus = !target.isActive;

      // If reactivating, check quota
      if (newStatus === true) {
        const company = await prisma.company.findUnique({
          where: { id: tenant.companyId },
          select: { maxUsers: true },
        });

        const activeCount = await prisma.user.count({
          where: { companyId: tenant.companyId, isActive: true },
        });

        if (company && activeCount >= company.maxUsers) {
          throw new AppError(
            "User quota exceeded (" + activeCount + "/" + company.maxUsers + "). Cannot reactivate.",
            "CONFLICT",
            409
          );
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { isActive: newStatus },
        });

        await tx.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: newStatus ? "REACTIVATE_USER" : "DEACTIVATE_USER",
            entity: "User",
            entityId: userId,
            oldValues: { isActive: target.isActive } as unknown as Prisma.InputJsonValue,
            newValues: { isActive: newStatus } as unknown as Prisma.InputJsonValue,
          },
        });
      });

      revalidatePath("/settings");
      return { isActive: newStatus };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
