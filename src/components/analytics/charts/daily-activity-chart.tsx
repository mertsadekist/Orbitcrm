"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ChartCard } from "./chart-card";
import type { ChartDataPoint } from "@/types/analytics";

type DailyActivityChartProps = {
  data: ChartDataPoint[];
};

function formatDateLabel(iso: unknown) {
  const d = new Date(String(iso));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DailyActivityChart({ data }: DailyActivityChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <ChartCard title="Daily Activity">
        <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
          No activity in the last 30 days
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Daily Activity" subtitle="Leads created per day (last 30 days)">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tickFormatter={formatDateLabel}
            tick={{ fontSize: 10 }}
            interval={4}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10 }}
            width={30}
          />
          <Tooltip
            labelFormatter={formatDateLabel}
            formatter={(value) => [value, "Leads"]}
          />
          <Bar dataKey="value" fill="#6366f1" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
