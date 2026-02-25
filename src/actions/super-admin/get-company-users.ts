"use server";

import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";

// ─── Types ──────────────────────────────────────────────

export type CompanyUserItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
};

// ─── Action ─────────────────────────────────────────────

export async function getCompanyUsers(companyId: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "getCompanyUsers",
    async () => {
      if (tenant.role !== "SUPER_ADMIN") {
        throw new AppError("Access denied", "FORBIDDEN", 403);
      }

      const users = await prisma.user.findMany({
        where: { companyId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
        },
        orderBy: { role: "asc" },
      });

      return users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        username: u.username,
        role: u.role,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      })) satisfies CompanyUserItem[];
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
