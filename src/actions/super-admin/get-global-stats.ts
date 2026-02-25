"use server";

import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";

export type MonthlyGrowthPoint = {
  month: string; // "2026-01"
  companies: number;
  users: number;
  leads: number;
  deals: number;
  revenue: number;
};

export type PlanDistributionPoint = {
  plan: string;
  count: number;
};

export type GlobalStats = {
  totalCompanies: number;
  totalUsers: number;
  totalLeads: number;
  totalDeals: number;
  totalRevenue: number;
  avgRevenuePerCompany: number;
  growth: MonthlyGrowthPoint[];
  planDistribution: PlanDistributionPoint[];
};

export async function getGlobalStats() {
  const tenant = await getTenant();

  return withErrorHandling(
    "getGlobalStats",
    async () => {
      if (tenant.role !== "SUPER_ADMIN") {
        throw new AppError("Access denied", "FORBIDDEN", 403);
      }

      // KPIs in parallel
      const [totalCompanies, totalUsers, totalLeads, totalDeals, revenueAgg] =
        await Promise.all([
          prisma.company.count(),
          prisma.user.count(),
          prisma.lead.count(),
          prisma.deal.count(),
          prisma.deal.aggregate({
            where: { stage: "CLOSED_WON" },
            _sum: { value: true },
          }),
        ]);

      const totalRevenue = Number(revenueAgg._sum.value ?? 0);
      const avgRevenuePerCompany =
        totalCompanies > 0 ? totalRevenue / totalCompanies : 0;

      // Growth: last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const [companiesRaw, usersRaw, leadsRaw, dealsRaw, revenueRaw] =
        await Promise.all([
          prisma.$queryRaw<{ month: string; count: bigint }[]>`
            SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month, COUNT(*) AS count
            FROM companies
            WHERE createdAt >= ${twelveMonthsAgo}
            GROUP BY month
            ORDER BY month
          `,
          prisma.$queryRaw<{ month: string; count: bigint }[]>`
            SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month, COUNT(*) AS count
            FROM users
            WHERE createdAt >= ${twelveMonthsAgo}
            GROUP BY month
            ORDER BY month
          `,
          prisma.$queryRaw<{ month: string; count: bigint }[]>`
            SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month, COUNT(*) AS count
            FROM leads
            WHERE createdAt >= ${twelveMonthsAgo}
            GROUP BY month
            ORDER BY month
          `,
          prisma.$queryRaw<{ month: string; count: bigint }[]>`
            SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month, COUNT(*) AS count
            FROM deals
            WHERE createdAt >= ${twelveMonthsAgo}
            GROUP BY month
            ORDER BY month
          `,
          prisma.$queryRaw<{ month: string; total: number }[]>`
            SELECT DATE_FORMAT(closedAt, '%Y-%m') AS month, COALESCE(SUM(value), 0) AS total
            FROM deals
            WHERE stage = 'CLOSED_WON' AND closedAt >= ${twelveMonthsAgo}
            GROUP BY month
            ORDER BY month
          `,
        ]);

      // Build lookup maps
      const companiesMap = new Map(
        companiesRaw.map((r) => [r.month, Number(r.count)])
      );
      const usersMap = new Map(
        usersRaw.map((r) => [r.month, Number(r.count)])
      );
      const leadsMap = new Map(
        leadsRaw.map((r) => [r.month, Number(r.count)])
      );
      const dealsMap = new Map(
        dealsRaw.map((r) => [r.month, Number(r.count)])
      );
      const revenueMap = new Map(
        revenueRaw.map((r) => [r.month, Number(r.total)])
      );

      // Generate all 12 months, filling with 0 for months with no data
      const growth: MonthlyGrowthPoint[] = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        growth.push({
          month,
          companies: companiesMap.get(month) ?? 0,
          users: usersMap.get(month) ?? 0,
          leads: leadsMap.get(month) ?? 0,
          deals: dealsMap.get(month) ?? 0,
          revenue: revenueMap.get(month) ?? 0,
        });
      }

      // Plan distribution
      const planGroups = await prisma.company.groupBy({
        by: ["plan"],
        _count: { _all: true },
      });

      const planDistribution: PlanDistributionPoint[] = planGroups.map(
        (g) => ({
          plan: g.plan,
          count: g._count._all,
        })
      );

      return {
        totalCompanies,
        totalUsers,
        totalLeads,
        totalDeals,
        totalRevenue,
        avgRevenuePerCompany,
        growth,
        planDistribution,
      } satisfies GlobalStats;
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
