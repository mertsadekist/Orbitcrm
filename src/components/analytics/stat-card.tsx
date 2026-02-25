"use client";

import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Banknote,
  BarChart3,
  Target,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { StatCardData } from "@/types/analytics";

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  TrendingUp,
  DollarSign,
  Banknote,
  BarChart3,
  Target,
  Building2,
};

function formatValue(value: number | string, fmt: StatCardData["format"]) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);

  switch (fmt) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
    case "percentage":
      return num.toFixed(1) + "%";
    case "number":
    default:
      return new Intl.NumberFormat("en-US").format(num);
  }
}

type StatCardProps = {
  data: StatCardData;
};

export function StatCard({ data }: StatCardProps) {
  const Icon = ICON_MAP[data.icon] ?? BarChart3;
  const change = data.change ?? 0;
  const isPositive = change >= 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{data.label}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold">
            {formatValue(data.value, data.format)}
          </p>
          {data.changeLabel && (
            <div className="mt-1 flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span
                className={
                  "text-xs " +
                  (isPositive
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400")
                }
              >
                {isPositive ? "+" : ""}
                {change.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">
                {data.changeLabel}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
