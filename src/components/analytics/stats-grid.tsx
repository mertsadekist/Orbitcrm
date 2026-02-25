"use client";

import { StatCard } from "@/components/analytics/stat-card";
import type { StatCardData } from "@/types/analytics";

type StatsGridProps = {
  stats: StatCardData[];
};

export function StatsGrid({ stats }: StatsGridProps) {
  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {stats.map((card) => (
        <StatCard key={card.label} data={card} />
      ))}
    </div>
  );
}
