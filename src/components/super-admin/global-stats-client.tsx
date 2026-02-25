"use client";

import type { GlobalStats } from "@/actions/super-admin/get-global-stats";
import type { StatCardData } from "@/types/analytics";
import { StatCard } from "@/components/analytics/stat-card";
import { ChartCard } from "@/components/analytics/charts/chart-card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const PLAN_COLORS: Record<string, string> = {
  FREE: "#94a3b8",
  STARTER: "#6366f1",
  PROFESSIONAL: "#10b981",
  ENTERPRISE: "#f59e0b",
};

function formatMonth(value: unknown) {
  const [year, month] = String(value).split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString("en-US", { month: "short" });
}

function formatDollar(value: unknown) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

type GlobalStatsClientProps = {
  data: GlobalStats | null;
};

export function GlobalStatsClient({ data }: GlobalStatsClientProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <p className="text-muted-foreground">
          Failed to load stats. Please try again later.
        </p>
      </div>
    );
  }

  const kpis: StatCardData[] = [
    {
      label: "Total Companies",
      value: data.totalCompanies,
      icon: "Building2",
      format: "number",
    },
    {
      label: "Total Users",
      value: data.totalUsers,
      icon: "Users",
      format: "number",
    },
    {
      label: "Total Leads",
      value: data.totalLeads,
      icon: "Target",
      format: "number",
    },
    {
      label: "Total Deals",
      value: data.totalDeals,
      icon: "Banknote",
      format: "number",
    },
    {
      label: "Total Revenue",
      value: data.totalRevenue,
      icon: "DollarSign",
      format: "currency",
    },
    {
      label: "Avg Revenue/Company",
      value: data.avgRevenuePerCompany,
      icon: "TrendingUp",
      format: "currency",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <StatCard key={k.label} data={k} />
        ))}
      </div>

      {/* Growth area chart - full width */}
      <ChartCard title="Platform Growth" subtitle="Last 12 months">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data.growth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatMonth} />
            <YAxis />
            <Tooltip labelFormatter={formatMonth} />
            <Legend />
            <Area
              type="monotone"
              dataKey="companies"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.1}
              name="Companies"
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.1}
              name="Users"
            />
            <Area
              type="monotone"
              dataKey="leads"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.1}
              name="Leads"
            />
            <Area
              type="monotone"
              dataKey="deals"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.1}
              name="Deals"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Revenue + Plan distribution side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Monthly Revenue" subtitle="Closed won deals">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.growth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={formatMonth} />
                <YAxis tickFormatter={formatDollar} />
                <Tooltip
                  formatter={formatDollar}
                  labelFormatter={formatMonth}
                />
                <Bar
                  dataKey="revenue"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  name="Revenue"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div>
          <ChartCard title="Plan Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.planDistribution}
                  dataKey="count"
                  nameKey="plan"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {data.planDistribution.map((entry) => (
                    <Cell
                      key={entry.plan}
                      fill={PLAN_COLORS[entry.plan] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
