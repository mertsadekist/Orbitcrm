"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant, hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import type { UserPermissions } from "@/types/user-management";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

export async function updatePermissions(
  userId: string,
  permissions: UserPermissions
) {
  const tenant = await getTenant();

  return withErrorHandling(
    "updatePermissions",
    async () => {
      // OWNER+ can update anyone, MANAGER can update EMPLOYEE only
      if (!hasMinimumRole(tenant.role, "MANAGER")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      const target = await prisma.user.findFirst({
        where: { id: userId, companyId: tenant.companyId },
      });

      if (!target) {
        throw new AppError("User not found", "NOT_FOUND", 404);
      }

      // Only EMPLOYEE needs granular permissions
      if (target.role !== "EMPLOYEE") {
        throw new AppError(
          "Permissions only apply to employees. Managers and above have full access.",
          "VALIDATION_ERROR",
          400
        );
      }

      // MANAGER can only update EMPLOYEE (already verified above)
      // OWNER+ can update any EMPLOYEE
      if (tenant.role === "MANAGER" && target.role !== "EMPLOYEE") {
        throw new AppError("Managers can only update employee permissions", "FORBIDDEN", 403);
      }

      const oldPermissions = target.permissions as Record<string, boolean> | null;

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            permissions: permissions as unknown as Prisma.InputJsonValue,
          },
        });

        await tx.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "UPDATE_PERMISSIONS",
            entity: "User",
            entityId: userId,
            oldValues: (oldPermissions ?? {}) as unknown as Prisma.InputJsonValue,
            newValues: permissions as unknown as Prisma.InputJsonValue,
          },
        });
      });

      revalidatePath("/settings");
      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
