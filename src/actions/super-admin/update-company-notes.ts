"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";

// ─── Action ─────────────────────────────────────────────

export async function updateCompanyNotes(companyId: string, notes: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "updateCompanyNotes",
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

      await prisma.company.update({
        where: { id: companyId },
        data: { notes: notes || null },
      });

      revalidatePath("/super-admin/companies");
      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
