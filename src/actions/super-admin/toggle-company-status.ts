"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";

// ─── Action ─────────────────────────────────────────────

export async function toggleCompanyStatus(companyId: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "toggleCompanyStatus",
    async () => {
      if (tenant.role !== "SUPER_ADMIN") {
        throw new AppError("Access denied", "FORBIDDEN", 403);
      }

      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new AppError("Company not found", "NOT_FOUND", 404);
      }

      const newStatus = !company.isActive;

      await prisma.$transaction(async (tx) => {
        await tx.company.update({
          where: { id: companyId },
          data: { isActive: newStatus },
        });

        await tx.auditLog.create({
          data: {
            companyId,
            userId: tenant.userId,
            action: "TOGGLE_COMPANY_STATUS",
            entity: "Company",
            entityId: companyId,
            oldValues: { isActive: company.isActive } as unknown as Prisma.InputJsonValue,
            newValues: { isActive: newStatus } as unknown as Prisma.InputJsonValue,
          },
        });
      });

      revalidatePath("/super-admin/companies");
      return { isActive: newStatus };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
