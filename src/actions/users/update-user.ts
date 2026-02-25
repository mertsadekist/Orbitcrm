"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant, hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { updateUserSchema } from "@/lib/validators/user-schema";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

export async function updateUser(userId: string, input: unknown) {
  const tenant = await getTenant();

  return withErrorHandling(
    "updateUser",
    async () => {
      if (!hasMinimumRole(tenant.role, "OWNER")) {
        throw new AppError("Only owners can update users", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      const parsed = updateUserSchema.safeParse(input);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.issues[0]?.message ?? "Invalid user data",
          "VALIDATION_ERROR",
          400
        );
      }

      const data = parsed.data;

      // Verify target user is in same company
      const target = await prisma.user.findFirst({
        where: { id: userId, companyId: tenant.companyId },
      });

      if (!target) {
        throw new AppError("User not found", "NOT_FOUND", 404);
      }

      // Can't promote to OWNER/SUPER_ADMIN
      if (data.role && (data.role !== "MANAGER" && data.role !== "EMPLOYEE")) {
        throw new AppError("Cannot assign this role", "FORBIDDEN", 403);
      }

      // Can't deactivate self
      if (data.isActive === false && userId === tenant.userId) {
        throw new AppError("Cannot deactivate your own account", "CONFLICT", 409);
      }

      // Check email uniqueness if changing
      if (data.email && data.email !== target.email) {
        const emailExists = await prisma.user.findFirst({
          where: {
            companyId: tenant.companyId,
            email: data.email,
            id: { not: userId },
          },
        });
        if (emailExists) {
          throw new AppError("Email already in use", "CONFLICT", 409);
        }
      }

      // Build old values for audit
      const oldValues: Record<string, unknown> = {};
      const newValues: Record<string, unknown> = {};

      if (data.firstName !== undefined && data.firstName !== target.firstName) {
        oldValues.firstName = target.firstName;
        newValues.firstName = data.firstName;
      }
      if (data.lastName !== undefined && data.lastName !== target.lastName) {
        oldValues.lastName = target.lastName;
        newValues.lastName = data.lastName;
      }
      if (data.email !== undefined && data.email !== target.email) {
        oldValues.email = target.email;
        newValues.email = data.email;
      }
      if (data.phone !== undefined && data.phone !== (target.phone ?? "")) {
        oldValues.phone = target.phone;
        newValues.phone = data.phone;
      }
      if (data.role !== undefined && data.role !== target.role) {
        oldValues.role = target.role;
        newValues.role = data.role;
      }
      if (data.isActive !== undefined && data.isActive !== target.isActive) {
        oldValues.isActive = target.isActive;
        newValues.isActive = data.isActive;
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(data.firstName !== undefined && { firstName: data.firstName }),
            ...(data.lastName !== undefined && { lastName: data.lastName }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.phone !== undefined && { phone: data.phone || null }),
            ...(data.role !== undefined && { role: data.role }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
          },
        });

        await tx.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "UPDATE_USER",
            entity: "User",
            entityId: userId,
            oldValues: oldValues as unknown as Prisma.InputJsonValue,
            newValues: newValues as unknown as Prisma.InputJsonValue,
          },
        });
      });

      revalidatePath("/settings");
      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
