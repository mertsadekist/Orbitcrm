"use server";

import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";

type CompanyStats = {
  totalCompanies: number;
  totalUsers: number;
  totalLeads: number;
  totalDeals: number;
};

export async function getCompanyStats() {
  const tenant = await getTenant();

  return withErrorHandling(
    "getCompanyStats",
    async () => {
      if (tenant.role !== "SUPER_ADMIN") {
        throw new AppError("Access denied", "FORBIDDEN", 403);
      }

      const [totalCompanies, totalUsers, totalLeads, totalDeals] =
        await Promise.all([
          prisma.company.count(),
          prisma.user.count(),
          prisma.lead.count(),
          prisma.deal.count(),
        ]);

      return { totalCompanies, totalUsers, totalLeads, totalDeals };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
