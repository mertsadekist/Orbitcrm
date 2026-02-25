"use server";

import { prisma } from "@/lib/prisma";
import { getTenant, hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { getEffectivePermissions } from "@/lib/auth/permissions";
import type { SerializedUser } from "@/types/user-management";

export async function getUsers() {
  const tenant = await getTenant();

  return withErrorHandling(
    "getUsers",
    async () => {
      if (!hasMinimumRole(tenant.role, "MANAGER")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      const users = await prisma.user.findMany({
        where: { companyId: tenant.companyId },
        include: {
          _count: {
            select: {
              assignedLeads: true,
              assignedDeals: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const serialized: SerializedUser[] = users.map((u) => ({
        id: u.id,
        companyId: u.companyId,
        username: u.username,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        avatar: u.avatar,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive,
        permissions: getEffectivePermissions(
          u.role,
          u.permissions as Record<string, boolean> | null
        ),
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        _count: u._count,
      }));

      return serialized;
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
