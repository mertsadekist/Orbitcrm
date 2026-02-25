import { Suspense } from "react";
import { redirect } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { getAnalyticsStats } from "@/actions/analytics/get-analytics-stats";
import { getChartData } from "@/actions/analytics/get-chart-data";
import { QueryBuilder } from "@/components/analytics/query-builder";
import { StatsGrid } from "@/components/analytics/stats-grid";
import { LeadsBySourceChart } from "@/components/analytics/charts/leads-by-source-chart";
import { DailyActivityChart } from "@/components/analytics/charts/daily-activity-chart";
import { FunnelChart } from "@/components/analytics/charts/funnel-chart";
import { ExportButton } from "@/components/analytics/export-button";

type AnalyticsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const tenant = await getTenant();

  if (!tenant.permissions.canViewAnalytics) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const filtersB64 =
    typeof params.f === "string" ? params.f : undefined;

  const [statsResult, chartsResult, companyUsers] = await Promise.all([
    getAnalyticsStats(filtersB64),
    getChartData(filtersB64),
    prisma.user.findMany({
      where: { companyId: tenant.companyId, isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  const stats = statsResult.success ? statsResult.data : [];
  const charts = chartsResult.success
    ? chartsResult.data
    : { leadsBySource: [], dailyActivity: [], funnel: [] };

  return (
    <NuqsAdapter>
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <ExportButton filtersB64={filtersB64} canExportData={tenant.permissions.canExportData} />
        </div>

        <Suspense>
          <QueryBuilder companyUsers={companyUsers} />
        </Suspense>

        <StatsGrid stats={stats} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LeadsBySourceChart data={charts.leadsBySource} />
          <DailyActivityChart data={charts.dailyActivity} />
        </div>

        <FunnelChart data={charts.funnel} />
      </div>
    </NuqsAdapter>
  );
}
