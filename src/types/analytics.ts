// src/types/analytics.ts

// Filterable fields
export type FilterableField =
  | "status"
  | "source"
  | "score"
  | "assignedToId"
  | "createdAt"
  | "convertedAt"
  | "tags"
  | "deal.stage"
  | "deal.value"
  | "deal.closedAt";

// Operators by field type
export type StringOperator = "equals" | "contains" | "startsWith";
export type EnumOperator = "equals" | "in";
export type NumberOperator =
  | "equals"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between";
export type DateOperator =
  | "after"
  | "before"
  | "between"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "thisYear";
export type RelationOperator = "equals";

export type Operator =
  | StringOperator
  | EnumOperator
  | NumberOperator
  | DateOperator
  | RelationOperator;

// Single filter row
export interface FilterRow {
  id: string;
  field: FilterableField;
  operator: Operator | string;
  value?: string;
  value2?: string; // for "between" operator
}

// Full filter state (URL-serializable)
export interface FilterState {
  filters: FilterRow[];
  dateRange: { from?: string; to?: string };
}

// Analytics data types
export interface StatCardData {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: string;
  format: "number" | "currency" | "percentage";
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface FunnelStep {
  stage: string;
  count: number;
  percentage: number;
  dropOff: number;
}

export interface AnalyticsResponse {
  stats: StatCardData[];
  leadsBySource: ChartDataPoint[];
  dailyActivity: ChartDataPoint[];
  funnel: FunnelStep[];
  period: { from: string; to: string };
}
