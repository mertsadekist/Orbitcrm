"use client";

import { ChartCard } from "./chart-card";
import type { FunnelStep } from "@/types/analytics";

const STAGE_COLORS = [
  "bg-indigo-500",
  "bg-blue-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-green-500",
];

type FunnelChartProps = {
  data: FunnelStep[];
};

export function FunnelChart({ data }: FunnelChartProps) {
  if (data.length === 0 || data[0].count === 0) {
    return (
      <ChartCard title="Conversion Funnel">
        <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
          No data available
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Conversion Funnel"
      subtitle="Lead progression through stages"
    >
      <div className="space-y-3 py-2">
        {data.map((step, i) => {
          const widthPct = Math.max(step.percentage, 5);

          return (
            <div key={step.stage} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{step.stage}</span>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums">{step.count}</span>
                  <span className="text-xs text-muted-foreground w-14 text-right">
                    {step.percentage.toFixed(1)}%
                  </span>
                  {i > 0 && step.dropOff > 0 && (
                    <span className="text-xs text-red-500 w-20 text-right">
                      -{step.dropOff.toFixed(1)}% drop
                    </span>
                  )}
                </div>
              </div>
              <div className="h-6 w-full rounded-sm bg-muted">
                <div
                  className={
                    "h-full rounded-sm transition-all " +
                    (STAGE_COLORS[i] ?? "bg-gray-500")
                  }
                  style={{ width: widthPct + "%" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
