"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant, hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { createUserSchema } from "@/lib/validators/user-schema";
import { DEFAULT_PERMISSIONS } from "@/lib/auth/permissions";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

export async function createUser(input: unknown) {
  const tenant = await getTenant();

  return withErrorHandling(
    "createUser",
    async () => {
      if (!hasMinimumRole(tenant.role, "OWNER")) {
        throw new AppError("Only owners can create users", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      const parsed = createUserSchema.safeParse(input);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.issues[0]?.message ?? "Invalid user data",
          "VALIDATION_ERROR",
          400
        );
      }

      const data = parsed.data;

      // Quota check
      const company = await prisma.company.findUnique({
        where: { id: tenant.companyId },
        select: { maxUsers: true },
      });
      if (!company) {
        throw new AppError("Company not found", "NOT_FOUND", 404);
      }

      const activeCount = await prisma.user.count({
        where: { companyId: tenant.companyId, isActive: true },
      });

      if (activeCount >= company.maxUsers) {
        throw new AppError(
          "User quota exceeded (" + activeCount + "/" + company.maxUsers + ")",
          "CONFLICT",
          409
        );
      }

      // Unique checks
      const existing = await prisma.user.findFirst({
        where: {
          companyId: tenant.companyId,
          OR: [{ username: data.username }, { email: data.email }],
        },
      });

      if (existing) {
        const field =
          existing.username === data.username ? "username" : "email";
        throw new AppError(
          "A user with this " + field + " already exists",
          "CONFLICT",
          409
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 12);

      // Create user + audit log
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            companyId: tenant.companyId,
            username: data.username,
            email: data.email,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone || null,
            role: data.role,
            permissions: DEFAULT_PERMISSIONS as unknown as Prisma.InputJsonValue,
          },
        });

        await tx.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "CREATE_USER",
            entity: "User",
            entityId: newUser.id,
            newValues: {
              username: data.username,
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              role: data.role,
            } as unknown as Prisma.InputJsonValue,
          },
        });

        return newUser;
      });

      revalidatePath("/settings");
      return { userId: user.id };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
