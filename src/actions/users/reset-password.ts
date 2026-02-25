"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant, hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { resetPasswordSchema } from "@/lib/validators/user-schema";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

export async function resetPassword(userId: string, input: unknown) {
  const tenant = await getTenant();

  return withErrorHandling(
    "resetPassword",
    async () => {
      if (!hasMinimumRole(tenant.role, "OWNER")) {
        throw new AppError("Only owners can reset passwords", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      const parsed = resetPasswordSchema.safeParse(input);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.issues[0]?.message ?? "Invalid password",
          "VALIDATION_ERROR",
          400
        );
      }

      const target = await prisma.user.findFirst({
        where: { id: userId, companyId: tenant.companyId },
      });

      if (!target) {
        throw new AppError("User not found", "NOT_FOUND", 404);
      }

      const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { passwordHash },
        });

        await tx.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "RESET_PASSWORD",
            entity: "User",
            entityId: userId,
            newValues: {
              target: target.username,
            } as unknown as Prisma.InputJsonValue,
          },
        });
      });

      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
