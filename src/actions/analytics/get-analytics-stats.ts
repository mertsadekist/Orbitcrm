"use server";

import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { deserializeFilters } from "@/lib/analytics/filter-serializer";
import { buildPrismaWhere } from "@/lib/analytics/build-prisma-where";
import type { StatCardData } from "@/types/analytics";

function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export async function getAnalyticsStats(filtersB64?: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "getAnalyticsStats",
    async () => {
      if (!hasMinimumRole(tenant.role, "EMPLOYEE")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      const filters = deserializeFilters(filtersB64);
      const { leadWhere, dealWhere } = buildPrismaWhere(
        filters,
        tenant.companyId
      );

      const [
        totalLeads,
        converted,
        pipelineAgg,
        revenueAgg,
        avgDealAgg,
        avgScoreAgg,
      ] = await Promise.all([
        prisma.lead.count({ where: leadWhere }),
        prisma.lead.count({
          where: { ...leadWhere, status: "CONVERTED" },
        }),
        prisma.deal.aggregate({
          where: {
            ...dealWhere,
            stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] },
          },
          _sum: { value: true },
        }),
        prisma.deal.aggregate({
          where: { ...dealWhere, stage: "CLOSED_WON" },
          _sum: { value: true },
        }),
        prisma.deal.aggregate({
          where: dealWhere,
          _avg: { value: true },
        }),
        prisma.lead.aggregate({
          where: leadWhere,
          _avg: { score: true },
        }),
      ]);

      const pipelineValue = Number(pipelineAgg._sum.value ?? 0);
      const revenue = Number(revenueAgg._sum.value ?? 0);
      const avgDeal = Number(avgDealAgg._avg.value ?? 0);
      const avgScore = Number(avgScoreAgg._avg.score ?? 0);
      const conversionRate =
        totalLeads > 0 ? (converted / totalLeads) * 100 : 0;

      // Previous period placeholder
      const prev = {
        totalLeads: 0,
        conversionRate: 0,
        pipelineValue: 0,
        revenue: 0,
        avgDeal: 0,
        avgScore: 0,
      };

      const cards: StatCardData[] = [
        {
          label: "Total Leads",
          value: totalLeads,
          change: pctChange(totalLeads, prev.totalLeads),
          changeLabel: "vs previous period",
          icon: "Users",
          format: "number",
        },
        {
          label: "Conversion Rate",
          value: Math.round(conversionRate * 10) / 10,
          change: pctChange(conversionRate, prev.conversionRate),
          changeLabel: "vs previous period",
          icon: "TrendingUp",
          format: "percentage",
        },
        {
          label: "Pipeline Value",
          value: pipelineValue,
          change: pctChange(pipelineValue, prev.pipelineValue),
          changeLabel: "vs previous period",
          icon: "DollarSign",
          format: "currency",
        },
        {
          label: "Total Revenue",
          value: revenue,
          change: pctChange(revenue, prev.revenue),
          changeLabel: "vs previous period",
          icon: "Banknote",
          format: "currency",
        },
        {
          label: "Avg Deal Size",
          value: Math.round(avgDeal),
          change: pctChange(avgDeal, prev.avgDeal),
          changeLabel: "vs previous period",
          icon: "BarChart3",
          format: "currency",
        },
        {
          label: "Avg Lead Score",
          value: Math.round(avgScore),
          change: pctChange(avgScore, prev.avgScore),
          changeLabel: "vs previous period",
          icon: "Target",
          format: "number",
        },
      ];

      return cards;
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
