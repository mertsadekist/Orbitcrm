"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartCard } from "./chart-card";
import type { ChartDataPoint } from "@/types/analytics";

const DEFAULT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

type LeadsBySourceChartProps = {
  data: ChartDataPoint[];
};

export function LeadsBySourceChart({ data }: LeadsBySourceChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <ChartCard title="Leads by Source">
        <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
          No data available
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Leads by Source" subtitle={total + " total leads"}>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.label}
                fill={entry.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [value, name]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span className="text-xs">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
