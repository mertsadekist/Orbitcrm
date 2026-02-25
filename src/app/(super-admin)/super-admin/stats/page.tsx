import type { Metadata } from "next";
import {
  getGlobalStats,
  type GlobalStats,
} from "@/actions/super-admin/get-global-stats";
import { GlobalStatsClient } from "@/components/super-admin/global-stats-client";

export const metadata: Metadata = {
  title: "Global Stats | OrbitFlow Admin",
};

export default async function StatsPage() {
  const result = await getGlobalStats();

  const data: GlobalStats | null = result.success ? result.data : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Global Stats</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide metrics, growth trends, and revenue analytics.
        </p>
      </div>
      <GlobalStatsClient data={data} />
    </div>
  );
}
