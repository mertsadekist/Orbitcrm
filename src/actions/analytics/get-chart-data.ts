"use server";

import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { deserializeFilters } from "@/lib/analytics/filter-serializer";
import { buildPrismaWhere } from "@/lib/analytics/build-prisma-where";
import type { ChartDataPoint, FunnelStep } from "@/types/analytics";
import { eachDayOfInterval, subDays } from "date-fns";

export async function getChartData(filtersB64?: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "getChartData",
    async () => {
      if (!hasMinimumRole(tenant.role, "EMPLOYEE")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      const filters = deserializeFilters(filtersB64);
      const { leadWhere, dealWhere } = buildPrismaWhere(
        filters,
        tenant.companyId
      );

      // 1) Leads by Source
      const bySource = await prisma.lead.groupBy({
        where: leadWhere,
        by: ["source"],
        _count: { _all: true },
      });

      const sourceColors: Record<string, string> = {
        quiz: "#6366f1",
        manual: "#10b981",
        import: "#f59e0b",
      };

      const leadsBySource: ChartDataPoint[] = bySource.map((x) => ({
        label: String(x.source ?? "unknown"),
        value: Number(x._count._all),
        color: sourceColors[x.source] ?? "#94a3b8",
      }));

      // 2) Daily Activity (last 30 days)
      const to = new Date();
      const from = subDays(to, 30);
      const days = eachDayOfInterval({ start: from, end: to });

      const rawLeads = await prisma.lead.findMany({
        where: {
          ...leadWhere,
          createdAt: { gte: from, lte: to },
        },
        select: { createdAt: true },
      });

      const counts = new Map<string, number>();
      for (const r of rawLeads) {
        const key = new Date(r.createdAt).toISOString().slice(0, 10);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }

      const dailyActivity: ChartDataPoint[] = days.map((d) => {
        const key = d.toISOString().slice(0, 10);
        return { label: key, value: counts.get(key) ?? 0 };
      });

      // 3) Funnel
      const [total, contacted, qualified, converted, won] = await Promise.all([
        prisma.lead.count({ where: leadWhere }),
        prisma.lead.count({
          where: {
            ...leadWhere,
            status: { in: ["CONTACTED", "QUALIFIED", "CONVERTED"] },
          },
        }),
        prisma.lead.count({
          where: {
            ...leadWhere,
            status: { in: ["QUALIFIED", "CONVERTED"] },
          },
        }),
        prisma.lead.count({
          where: { ...leadWhere, status: "CONVERTED" },
        }),
        prisma.deal.count({
          where: { ...dealWhere, stage: "CLOSED_WON" },
        }),
      ]);

      const steps = [
        { stage: "Total Leads", count: total },
        { stage: "Contacted", count: contacted },
        { stage: "Qualified", count: qualified },
        { stage: "Converted", count: converted },
        { stage: "Won", count: won },
      ];

      const funnel: FunnelStep[] = steps.map((s, i) => {
        const base = steps[0].count || 1;
        const prev = i === 0 ? s.count : steps[i - 1].count || 1;
        const percentage = (s.count / base) * 100;
        const dropOff = i === 0 ? 0 : ((prev - s.count) / prev) * 100;
        return {
          stage: s.stage,
          count: s.count,
          percentage: Math.round(percentage * 10) / 10,
          dropOff: Math.round(dropOff * 10) / 10,
        };
      });

      return { leadsBySource, dailyActivity, funnel };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
