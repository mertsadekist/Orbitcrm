# Phase 6: Analytics & Reporting Engine — *The Infinite Filter Dashboard*
> ملف تشغيل خطوة-بخطوة داخل Visual Studio Code (Markdown)

---

## ✅ هدف المرحلة
بناء لوحة تحليلات متقدمة تحتوي على:
- **Query Builder** ديناميكي يحوّل فلاتر المستخدم إلى **Prisma WhereInput**
- بطاقات **KPI** مع مقارنة **بالفترة السابقة**
- رسوم بيانية تفاعلية (**Recharts**)
- **تصدير CSV**
- كل البيانات تحترم **الفلاتر النشطة** + **عزل المستأجرين (Tenant isolation)** عبر `companyId`

---

## 0) المتطلبات قبل البدء
- مشروع Next.js/TypeScript يعمل
- Prisma جاهز ومربوط بقاعدة البيانات
- Recharts مثبت (من Phase 1)
- nuqs مثبت (من Phase 4)
- date-fns موجود (من Phase 4)

---

## 1) تثبيت Dependencies (مرة واحدة)
> نفّذ داخل Terminal في VS Code من جذر المشروع

- [ ] إضافة مكونات shadcn الخاصة بالتواريخ:
```bash
npx shadcn@latest add calendar date-picker
```

- [ ] تثبيت date-fns (إذا غير موجود):
```bash
npm install date-fns
```

---

## 2) إنشاء Types (src/types/analytics.ts)
- [ ] أنشئ الملف: `src/types/analytics.ts`
- [ ] الصق المحتوى التالي:

```ts
// src/types/analytics.ts

// الحقول القابلة للفلترة
export type FilterableField =
  | "status" | "source" | "score" | "assignedToId"
  | "createdAt" | "convertedAt" | "tags"
  | "deal.stage" | "deal.value" | "deal.closedAt";

// المشغلات حسب نوع الحقل
export type StringOperator = "equals" | "contains" | "startsWith";
export type EnumOperator = "equals" | "in";
export type NumberOperator = "equals" | "gt" | "gte" | "lt" | "lte" | "between";
export type DateOperator =
  | "after" | "before" | "between"
  | "last7days" | "last30days" | "thisMonth" | "thisYear";
export type RelationOperator = "equals";

export type Operator =
  | StringOperator
  | EnumOperator
  | NumberOperator
  | DateOperator
  | RelationOperator;

// صف فلتر واحد
export interface FilterRow {
  id: string;           // cuid للتعريف الفريد
  field: FilterableField;
  operator: Operator | string; // يعتمد على نوع الحقل
  value?: string;       // قيمة مُسلسلة (serialized)
  value2?: string;      // للـ "between" operator
}

// حالة الفلتر الكاملة (قابلة للتسلسل في URL)
export interface FilterState {
  filters: FilterRow[];
  dateRange: { from?: string; to?: string };  // فترة عامة للمقارنة
}

// Analytics Data Types
export interface StatCardData {
  label: string;
  value: number | string;
  change?: number;        // نسبة التغيير عن الفترة السابقة (+ أو -)
  changeLabel?: string;   // مثل "vs last 30 days"
  icon: string;           // اسم أيقونة lucide
  format: "number" | "currency" | "percentage";
}

export interface ChartDataPoint {
  label: string;          // التسمية (تاريخ، مصدر، مرحلة)
  value: number;
  color?: string;
}

export interface FunnelStep {
  stage: string;
  count: number;
  percentage: number;     // نسبة من المرحلة الأولى
  dropOff: number;        // نسبة الخسارة من المرحلة السابقة
}

export interface AnalyticsResponse {
  stats: StatCardData[];
  leadsBySource: ChartDataPoint[];
  dailyActivity: ChartDataPoint[];
  funnel: FunnelStep[];
  period: { from: string; to: string };
}
```

---

## 3) إعداد Field Configuration (src/lib/analytics/field-config.ts)
### 3.1 جدول الحقول (مرجع سريع)
| Field | Type | Label | Operators | Input |
|---|---|---|---|---|
| status | enum | Lead Status | equals, in | Select (multi) من LeadStatus |
| source | enum | Source | equals, in | Select (multi): quiz, manual, import |
| score | number | Lead Score | equals, gt, gte, lt, lte, between | Number input(s) |
| assignedToId | relation | Assigned To | equals | User select/command |
| createdAt | date | Created Date | after, before, between, last7days, last30days, thisMonth, thisYear | Date picker / preset |
| convertedAt | date | Converted Date | after, before, between, presets | Date picker / preset |
| tags | string | Tags | equals, contains, startsWith | Text input |
| deal.stage | enum | Deal Stage | equals, in | Select (multi) من DealStage |
| deal.value | number | Deal Value | equals, gt, gte, lt, lte, between | Number input(s) |
| deal.closedAt | date | Deal Closed Date | after, before, between, presets | Date picker / preset |

### 3.2 إنشاء الملف
- [ ] أنشئ الملف: `src/lib/analytics/field-config.ts`
- [ ] الصق هذا الهيكل (ستحتاج لتعديل Enums حسب مشروعك):

```ts
// src/lib/analytics/field-config.ts
import type { FilterableField, Operator } from "@/types/analytics";

// عدّل هذه القيم حسب الـ enums الفعلية في مشروعك
export const LEAD_STATUS = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED"] as const;
export const LEAD_SOURCE = ["quiz", "manual", "import"] as const;

export const DEAL_STAGE = [
  "OPEN",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;

export type FieldType = "string" | "enum" | "number" | "date" | "relation";
export type InputType =
  | "text"
  | "number"
  | "select"
  | "multi-select"
  | "date"
  | "date-range"
  | "user-select";

export interface FieldDefinition {
  label: string;
  type: FieldType;
  operators: Operator[];
  options?: readonly string[]; // enum values
}

export const FIELD_CONFIG: Record<FilterableField, FieldDefinition> = {
  status: {
    label: "Lead Status",
    type: "enum",
    operators: ["equals", "in"],
    options: LEAD_STATUS,
  },
  source: {
    label: "Source",
    type: "enum",
    operators: ["equals", "in"],
    options: LEAD_SOURCE,
  },
  score: {
    label: "Lead Score",
    type: "number",
    operators: ["equals", "gt", "gte", "lt", "lte", "between"],
  },
  assignedToId: {
    label: "Assigned To",
    type: "relation",
    operators: ["equals"],
  },
  createdAt: {
    label: "Created Date",
    type: "date",
    operators: ["after", "before", "between", "last7days", "last30days", "thisMonth", "thisYear"],
  },
  convertedAt: {
    label: "Converted Date",
    type: "date",
    operators: ["after", "before", "between", "last7days", "last30days", "thisMonth", "thisYear"],
  },
  tags: {
    label: "Tags",
    type: "string",
    operators: ["equals", "contains", "startsWith"],
  },
  "deal.stage": {
    label: "Deal Stage",
    type: "enum",
    operators: ["equals", "in"],
    options: DEAL_STAGE,
  },
  "deal.value": {
    label: "Deal Value",
    type: "number",
    operators: ["equals", "gt", "gte", "lt", "lte", "between"],
  },
  "deal.closedAt": {
    label: "Deal Closed Date",
    type: "date",
    operators: ["after", "before", "between", "last7days", "last30days", "thisMonth", "thisYear"],
  },
};

export function getOperatorsForField(field: FilterableField): Operator[] {
  return FIELD_CONFIG[field].operators;
}

export function getInputTypeForOperator(field: FilterableField, operator: Operator): InputType {
  const def = FIELD_CONFIG[field];

  if (def.type === "enum") return operator === "in" ? "multi-select" : "select";
  if (def.type === "number") return operator === "between" ? "number" : "number";
  if (def.type === "date") return operator === "between" ? "date-range" : "date";
  if (def.type === "relation") return "user-select";

  // string
  return "text";
}
```

---

## 4) Dynamic Query Builder (src/lib/analytics/build-prisma-where.ts)
> أهم ملف في Phase 6: تحويل `FilterRow[]` إلى Prisma WhereInput  
> ✅ قواعد ثابتة:
- `companyId` يُضاف دائماً ولا يمكن تجاوزه
- كل الفلاتر تندمج بـ **AND**
- حقول `deal.*` → `deals: { some: { ... } }`
- Presets للتواريخ → تُحسب بـ `date-fns`
- تجاهل أي فلتر قيمته فارغة

- [ ] أنشئ الملف: `src/lib/analytics/build-prisma-where.ts`

```ts
// src/lib/analytics/build-prisma-where.ts
import { subDays, startOfMonth, startOfYear, endOfMonth, endOfYear } from "date-fns";
import type { FilterRow } from "@/types/analytics";
import type { Prisma } from "@prisma/client";

function isEmpty(v?: string) {
  return !v || v.trim().length === 0;
}

function parseCSV(v?: string): string[] {
  if (isEmpty(v)) return [];
  return v!.split(",").map(s => s.trim()).filter(Boolean);
}

function toNumber(v?: string): number | null {
  if (isEmpty(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function presetToDateRange(operator: string): { gte?: Date; lte?: Date } | null {
  const now = new Date();

  switch (operator) {
    case "last7days":
      return { gte: subDays(now, 7) };
    case "last30days":
      return { gte: subDays(now, 30) };
    case "thisMonth":
      return { gte: startOfMonth(now), lte: endOfMonth(now) };
    case "thisYear":
      return { gte: startOfYear(now), lte: endOfYear(now) };
    default:
      return null;
  }
}

function buildScalarCondition(row: FilterRow): any | null {
  const { operator, value, value2 } = row;

  // Operators بدون قيمة (presets)
  const preset = presetToDateRange(String(operator));
  if (preset) return preset;

  if (operator === "between") {
    if (isEmpty(value) || isEmpty(value2)) return null;
    const n1 = toNumber(value);
    const n2 = toNumber(value2);
    if (n1 === null || n2 === null) return null;
    return { gte: n1, lte: n2 };
  }

  if (operator === "in") {
    const arr = parseCSV(value);
    if (!arr.length) return null;
    return { in: arr };
  }

  if (operator === "equals") {
    if (isEmpty(value)) return null;
    return { equals: value };
  }

  if (operator === "contains") {
    if (isEmpty(value)) return null;
    return { contains: value, mode: "insensitive" };
  }

  if (operator === "startsWith") {
    if (isEmpty(value)) return null;
    return { startsWith: value, mode: "insensitive" };
  }

  // Numbers
  if (["gt", "gte", "lt", "lte"].includes(String(operator))) {
    const n = toNumber(value);
    if (n === null) return null;
    return { [operator]: n };
  }

  // Dates
  if (operator === "after") {
    if (isEmpty(value)) return null;
    const d = new Date(value!);
    if (Number.isNaN(d.getTime())) return null;
    return { gte: d };
  }

  if (operator === "before") {
    if (isEmpty(value)) return null;
    const d = new Date(value!);
    if (Number.isNaN(d.getTime())) return null;
    return { lte: d };
  }

  return null;
}

export function buildPrismaWhere(
  filters: FilterRow[],
  companyId: string
): { leadWhere: Prisma.LeadWhereInput; dealWhere?: Prisma.DealWhereInput } {
  const and: Prisma.LeadWhereInput[] = [];

  // ✅ Tenant isolation دائماً
  and.push({ companyId });

  for (const row of filters) {
    if (!row?.field) continue;

    // deal.* fields
    if (row.field.startsWith("deal.")) {
      const dealField = row.field.replace("deal.", "");
      const cond = buildScalarCondition(row);
      if (!cond) continue;

      and.push({
        deals: {
          some: {
            [dealField]: cond,
          },
        },
      });
      continue;
    }

    // Lead fields
    const cond = buildScalarCondition(row);
    if (!cond) continue;

    and.push({ [row.field]: cond } as Prisma.LeadWhereInput);
  }

  const leadWhere: Prisma.LeadWhereInput = { AND: and };

  // dealWhere (اختياري) لتجميعات deals مباشرة
  // ملاحظة: نحافظ على نفس منطق tenant عبر علاقة lead.companyId
  const dealWhere: Prisma.DealWhereInput = {
    lead: { companyId },
  };

  return { leadWhere, dealWhere };
}
```

---

## 5) Serializer للفلاتر (src/lib/analytics/filter-serializer.ts)
> يُستخدم مع nuqs لحفظ الفلاتر داخل URL (base64 JSON)

- [ ] أنشئ الملف: `src/lib/analytics/filter-serializer.ts`

```ts
// src/lib/analytics/filter-serializer.ts
import type { FilterRow } from "@/types/analytics";

export function serializeFilters(filters: FilterRow[]): string {
  const json = JSON.stringify(filters ?? []);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function deserializeFilters(str?: string | null): FilterRow[] {
  if (!str) return [];
  try {
    const json = Buffer.from(str, "base64url").toString("utf8");
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
```

---

## 6) CSV Formatter (src/lib/analytics/csv-formatter.ts)
- [ ] أنشئ الملف: `src/lib/analytics/csv-formatter.ts`

```ts
// src/lib/analytics/csv-formatter.ts
type AnyLead = any;

// Escape CSV value
function esc(v: any) {
  const s = String(v ?? "");
  const needs = /[",\n\r]/.test(s);
  const out = s.replace(/"/g, '""');
  return needs ? `"${out}"` : out;
}

export function formatLeadsToCSV(leads: AnyLead[]): string {
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Company",
    "Status",
    "Score",
    "Source",
    "Assigned To",
    "Created",
    "Quiz",
    "Deals Count",
    "Total Deal Value",
  ];

  const rows = leads.map((l) => {
    const assigned = l?.assignedTo ? `${l.assignedTo.firstName ?? ""} ${l.assignedTo.lastName ?? ""}`.trim() : "";
    const quizTitle = l?.quiz?.title ?? "";
    const dealsCount = Array.isArray(l?.deals) ? l.deals.length : 0;
    const totalDealValue = Array.isArray(l?.deals)
      ? l.deals.reduce((sum: number, d: any) => sum + (Number(d?.value) || 0), 0)
      : 0;

    return [
      esc(l?.name),
      esc(l?.email),
      esc(l?.phone),
      esc(l?.company),
      esc(l?.status),
      esc(l?.score),
      esc(l?.source),
      esc(assigned),
      esc(l?.createdAt ? new Date(l.createdAt).toISOString() : ""),
      esc(quizTitle),
      esc(dealsCount),
      esc(totalDealValue),
    ].join(",");
  });

  // BOM لدعم Excel العربي
  return "\ufeff" + [headers.join(","), ...rows].join("\n");
}
```

---

## 7) Server Actions (src/actions/analytics/)
> المتطلبات:
- **EMPLOYEE+** للـ stats + charts
- **MANAGER+** لتصدير CSV

> ملاحظة: ستحتاج لدمج نظام صلاحياتك (مثلاً `requireRole("EMPLOYEE")`) حسب مشروعك.

### 7.1 get-analytics-stats.ts
- [ ] أنشئ الملف: `src/actions/analytics/get-analytics-stats.ts`

```ts
// src/actions/analytics/get-analytics-stats.ts
"use server";

import { prisma } from "@/lib/prisma"; // عدّل المسار حسب مشروعك
import { deserializeFilters } from "@/lib/analytics/filter-serializer";
import { buildPrismaWhere } from "@/lib/analytics/build-prisma-where";
import type { StatCardData } from "@/types/analytics";

// TODO: استبدلها بنظامك الحقيقي
async function getTenant() {
  return { companyId: "COMPANY_ID", role: "EMPLOYEE" as const };
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export async function getAnalyticsStats(filtersB64?: string): Promise<StatCardData[]> {
  const { companyId } = await getTenant();

  const filters = deserializeFilters(filtersB64);
  const { leadWhere, dealWhere } = buildPrismaWhere(filters, companyId);

  // current period (اعتماداً على createdAt filters/presets إن وُجدت) — هنا مثال مبسط
  // يمكنك لاحقاً استخراج period الفعلي من FilterState.dateRange
  const current = await Promise.all([
    prisma.lead.count({ where: leadWhere }),
    prisma.lead.count({ where: { ...leadWhere, status: "CONVERTED" as any } }),
    prisma.deal.aggregate({
      where: { ...dealWhere, stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] as any } },
      _sum: { value: true },
    }),
    prisma.deal.aggregate({
      where: { ...dealWhere, stage: "CLOSED_WON" as any },
      _sum: { value: true },
    }),
    prisma.deal.aggregate({ where: dealWhere, _avg: { value: true } }),
    prisma.lead.aggregate({ where: leadWhere, _avg: { score: true } }),
  ]);

  const totalLeads = current[0];
  const converted = current[1];
  const pipelineValue = Number(current[2]?._sum?.value ?? 0);
  const revenue = Number(current[3]?._sum?.value ?? 0);
  const avgDeal = Number(current[4]?._avg?.value ?? 0);
  const avgScore = Number(current[5]?._avg?.score ?? 0);

  const conversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;

  // TODO: implement previous period using same duration shifted back
  // placeholder:
  const prev = {
    totalLeads: 0,
    conversionRate: 0,
    pipelineValue: 0,
    revenue: 0,
    avgDeal: 0,
    avgScore: 0,
  };

  const cards: StatCardData[] = [
    {
      label: "Total Leads",
      value: totalLeads,
      change: pctChange(totalLeads, prev.totalLeads),
      changeLabel: "vs previous period",
      icon: "Users",
      format: "number",
    },
    {
      label: "Conversion Rate",
      value: conversionRate,
      change: pctChange(conversionRate, prev.conversionRate),
      changeLabel: "vs previous period",
      icon: "TrendingUp",
      format: "percentage",
    },
    {
      label: "Pipeline Value",
      value: pipelineValue,
      change: pctChange(pipelineValue, prev.pipelineValue),
      changeLabel: "vs previous period",
      icon: "DollarSign",
      format: "currency",
    },
    {
      label: "Total Revenue",
      value: revenue,
      change: pctChange(revenue, prev.revenue),
      changeLabel: "vs previous period",
      icon: "Banknote",
      format: "currency",
    },
    {
      label: "Avg Deal Size",
      value: avgDeal,
      change: pctChange(avgDeal, prev.avgDeal),
      changeLabel: "vs previous period",
      icon: "BarChart3",
      format: "currency",
    },
    {
      label: "Avg Lead Score",
      value: avgScore,
      change: pctChange(avgScore, prev.avgScore),
      changeLabel: "vs previous period",
      icon: "Target",
      format: "number",
    },
  ];

  return cards;
}
```

### 7.2 get-chart-data.ts
- [ ] أنشئ الملف: `src/actions/analytics/get-chart-data.ts`

```ts
// src/actions/analytics/get-chart-data.ts
"use server";

import { prisma } from "@/lib/prisma"; // عدّل المسار حسب مشروعك
import { deserializeFilters } from "@/lib/analytics/filter-serializer";
import { buildPrismaWhere } from "@/lib/analytics/build-prisma-where";
import type { ChartDataPoint, FunnelStep } from "@/types/analytics";
import { eachDayOfInterval, formatISO, subDays } from "date-fns";

// TODO: استبدلها بنظامك الحقيقي
async function getTenant() {
  return { companyId: "COMPANY_ID", role: "EMPLOYEE" as const };
}

export async function getChartData(filtersB64?: string): Promise<{
  leadsBySource: ChartDataPoint[];
  dailyActivity: ChartDataPoint[];
  funnel: FunnelStep[];
}> {
  const { companyId } = await getTenant();
  const filters = deserializeFilters(filtersB64);
  const { leadWhere, dealWhere } = buildPrismaWhere(filters, companyId);

  // 1) Leads by Source
  const bySource = await prisma.lead.groupBy({
    where: leadWhere,
    by: ["source" as any],
    _count: { _all: true },
  });

  const leadsBySource: ChartDataPoint[] = bySource.map((x: any) => ({
    label: String(x.source ?? "unknown"),
    value: Number(x._count?._all ?? 0),
  }));

  // 2) Daily Activity (مثال مبسط: آخر 30 يوم)
  const to = new Date();
  const from = subDays(to, 30);
  const days = eachDayOfInterval({ start: from, end: to });

  // ملاحظة: groupBy على DATE(createdAt) قد يتطلب raw SQL حسب DB
  // هذا placeholder: يمكنك استبداله بـ prisma.$queryRaw حسب PostgreSQL/MySQL
  const raw = await prisma.lead.findMany({
    where: { ...leadWhere, createdAt: { gte: from, lte: to } as any },
    select: { createdAt: true },
  });

  const counts = new Map<string, number>();
  for (const r of raw) {
    const key = new Date(r.createdAt).toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const dailyActivity: ChartDataPoint[] = days.map((d) => {
    const key = d.toISOString().slice(0, 10);
    return { label: key, value: counts.get(key) ?? 0 };
  });

  // 3) Funnel
  const total = await prisma.lead.count({ where: leadWhere });
  const contacted = await prisma.lead.count({
    where: { ...leadWhere, status: { in: ["CONTACTED", "QUALIFIED", "CONVERTED"] as any } },
  });
  const qualified = await prisma.lead.count({
    where: { ...leadWhere, status: { in: ["QUALIFIED", "CONVERTED"] as any } },
  });
  const converted = await prisma.lead.count({
    where: { ...leadWhere, status: "CONVERTED" as any },
  });
  const won = await prisma.deal.count({
    where: { ...dealWhere, stage: "CLOSED_WON" as any },
  });

  const steps = [
    { stage: "Total", count: total },
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
    return { stage: s.stage, count: s.count, percentage, dropOff };
  });

  return { leadsBySource, dailyActivity, funnel };
}
```

### 7.3 export-csv.ts
- [ ] أنشئ الملف: `src/actions/analytics/export-csv.ts`

```ts
// src/actions/analytics/export-csv.ts
"use server";

import { prisma } from "@/lib/prisma"; // عدّل المسار حسب مشروعك
import { deserializeFilters } from "@/lib/analytics/filter-serializer";
import { buildPrismaWhere } from "@/lib/analytics/build-prisma-where";
import { formatLeadsToCSV } from "@/lib/analytics/csv-formatter";

// TODO: استبدلها بنظامك الحقيقي + صلاحيات MANAGER+
async function getTenant() {
  return { companyId: "COMPANY_ID", role: "MANAGER" as const };
}

export async function exportCSV(filtersB64?: string): Promise<string> {
  const { companyId } = await getTenant();

  const filters = deserializeFilters(filtersB64);
  const { leadWhere } = buildPrismaWhere(filters, companyId);

  const leads = await prisma.lead.findMany({
    where: leadWhere,
    include: { assignedTo: true, quiz: true, deals: true } as any,
    take: 10000,
  });

  return formatLeadsToCSV(leads as any);
}
```

---

## 8) Analytics Page (Server Component)
- [ ] أنشئ:
  - `src/app/(dashboard)/analytics/page.tsx`
  - `src/app/(dashboard)/analytics/loading.tsx`

### 8.1 page.tsx
```tsx
// src/app/(dashboard)/analytics/page.tsx
import { getAnalyticsStats } from "@/actions/analytics/get-analytics-stats";
import { getChartData } from "@/actions/analytics/get-chart-data";
import QueryBuilder from "@/components/analytics/query-builder";
import StatsGrid from "@/components/analytics/stats-grid";
import LeadsBySourceChart from "@/components/analytics/charts/leads-by-source-chart";
import DailyActivityChart from "@/components/analytics/charts/daily-activity-chart";
import FunnelChart from "@/components/analytics/charts/funnel-chart";
import ExportButton from "@/components/analytics/export-button";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: { f?: string };
}) {
  const filtersB64 = searchParams?.f;

  const [stats, charts] = await Promise.all([
    getAnalyticsStats(filtersB64),
    getChartData(filtersB64),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <ExportButton filtersB64={filtersB64} />
      </div>

      <QueryBuilder />

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LeadsBySourceChart data={charts.leadsBySource} />
        <DailyActivityChart data={charts.dailyActivity} />
      </div>

      <FunnelChart data={charts.funnel} />
    </div>
  );
}
```

### 8.2 loading.tsx
```tsx
// src/app/(dashboard)/analytics/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-xl bg-muted" />
        <div className="h-80 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
```

---

## 9) Query Builder UI (Client Components)
> هذه الملفات الأكثر تعقيداً: إدارة `FilterRow[]` + serialization عبر nuqs وتحديث URL فوراً

### 9.1 الملفات المطلوبة
- [ ] أنشئ الهيكل التالي:
```
src/components/analytics/
  query-builder.tsx
  filter-row.tsx
  filter-value-input.tsx
  inputs/
    enum-filter-input.tsx
    number-filter-input.tsx
    date-filter-input.tsx
    user-filter-input.tsx
```

### 9.2 query-builder.tsx (Skeleton عملي)
```tsx
// src/components/analytics/query-builder.tsx
"use client";

import { useMemo } from "react";
import { useQueryState } from "nuqs";
import { deserializeFilters, serializeFilters } from "@/lib/analytics/filter-serializer";
import type { FilterRow } from "@/types/analytics";
import FilterRowComp from "@/components/analytics/filter-row";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { cuid } from "@/lib/cuid"; // عدّل حسب مشروعك/استخدم crypto.randomUUID

export default function QueryBuilder() {
  const [f, setF] = useQueryState("f");

  const filters: FilterRow[] = useMemo(() => deserializeFilters(f), [f]);

  function update(next: FilterRow[]) {
    setF(serializeFilters(next));
  }

  function add() {
    update([
      ...filters,
      { id: typeof cuid === "function" ? cuid() : crypto.randomUUID(), field: "status", operator: "equals", value: "" },
    ]);
  }

  function clearAll() {
    update([]);
  }

  function remove(id: string) {
    update(filters.filter(x => x.id !== id));
  }

  function change(id: string, patch: Partial<FilterRow>) {
    update(filters.map(x => (x.id === id ? { ...x, ...patch } : x)));
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Query Builder</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={add}>
            <Plus className="mr-2 h-4 w-4" /> Add Filter
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear All
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {filters.map((row) => (
          <FilterRowComp
            key={row.id}
            row={row}
            onRemove={() => remove(row.id)}
            onChange={(patch) => change(row.id, patch)}
          />
        ))}
        {filters.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No filters yet. Click <b>Add Filter</b> to start.
          </div>
        )}
      </div>
    </div>
  );
}
```

> ملاحظة: بقية ملفات الـ UI (filter-row, inputs, charts, stat-card) تُنفّذ حسب نظامك وshadcn components.  
> **هذه الخطة ركّزت على جعل الملف “تشغيلي” ويحتوي الهيكل + نقاط التنفيذ + الأكواد الجوهرية.**

---

## 10) Stats Cards
- [ ] أنشئ:
  - `src/components/analytics/stats-grid.tsx`
  - `src/components/analytics/stat-card.tsx`

> تصميم: Grid 2×3 (desktop) أو 1×6 (mobile)  
> Format: number/currency/percentage + change indicator ▲/▼

---

## 11) Charts
- [ ] أنشئ:
```
src/components/analytics/charts/
  chart-card.tsx
  leads-by-source-chart.tsx
  daily-activity-chart.tsx
  funnel-chart.tsx
```

- [ ] Leads by Source: Donut (PieChart innerRadius)
- [ ] Daily Activity: Bar chart مع fill الأيام الفارغة
- [ ] Funnel: div bars مخصصة

---

## 12) Export CSV (Client)
- [ ] أنشئ: `src/components/analytics/export-button.tsx`
- [ ] السلوك:
  1) يستدعي `exportCSV(filtersB64)`
  2) Blob + download
  3) اسم الملف: `orbitflow-leads-{date}.csv`
  4) يظهر فقط لـ MANAGER+

---

## 13) تعديلات على الملفات الموجودة
- [ ] تعديل `sidebar.tsx`:
  - تفعيل رابط Analytics/Reports
  - أيقونة: `BarChart3` من `lucide-react`

- [ ] تعديل `src/app/(dashboard)/dashboard/page.tsx`:
  - إضافة mini stats cards + رابط: `View Full Analytics →`

---

## 14) هيكل الملفات (مرجع نهائي)
```
 למד المرحلة 6

src/
├── types/analytics.ts
├── lib/analytics/
│   ├── field-config.ts
│   ├── build-prisma-where.ts
│   ├── filter-serializer.ts
│   └── csv-formatter.ts
├── actions/analytics/
│   ├── get-analytics-stats.ts
│   ├── get-chart-data.ts
│   └── export-csv.ts
├── components/analytics/
│   ├── query-builder.tsx
│   ├── filter-row.tsx
│   ├── filter-value-input.tsx
│   ├── inputs/
│   │   ├── enum-filter-input.tsx
│   │   ├── number-filter-input.tsx
│   │   ├── date-filter-input.tsx
│   │   └── user-filter-input.tsx
│   ├── stats-grid.tsx
│   ├── stat-card.tsx
│   ├── charts/
│   │   ├── chart-card.tsx
│   │   ├── leads-by-source-chart.tsx
│   │   ├── daily-activity-chart.tsx
│   │   └── funnel-chart.tsx
│   └── export-button.tsx
└── app/(dashboard)/analytics/
    ├── page.tsx
    └── loading.tsx
```

---

## 15) Verification Checklist (التحقق)
- [ ] Query Builder: إضافة فلتر `Status = NEW` → البطاقات والرسوم تتحدث فوراً
- [ ] Multiple Filters: status + score > 50 + last 30 days → كل النتائج AND
- [ ] URL Persistence: انسخ URL والصقه في تبويب جديد → نفس الفلاتر
- [ ] Stats Cards: Total Leads + change% صحيح
- [ ] Conversion Rate: `CONVERTED / Total * 100` صحيح
- [ ] Pie Chart: quiz/manual/import بنسب صحيحة
- [ ] Daily: آخر 30 يوم + fill للأيام الفارغة بـ 0
- [ ] Funnel: تناقص منطقي + drop-off صحيح
- [ ] CSV Export: ملف CSV يفتح في Excel والبيانات مُفلترة
- [ ] Dark Mode: الرسوم والبطاقات تتبع theme
- [ ] Empty State: “No data matches your filters”
- [ ] Permission: CSV يظهر فقط لـ MANAGER+
- [ ] Tenant isolation: كل الاستعلامات محصورة بـ `companyId`

---

## 16) ملاحظات تنفيذ سريعة
- **GroupBy على تاريخ (DATE(createdAt))**: قد يحتاج `prisma.$queryRaw` حسب قاعدة البيانات.
- **صلاحيات EMPLOYEE/MANAGER**: اربطها بوسطاء auth في مشروعك (guard/role checks).
- **FilterState.dateRange**: إذا كان لديك مقارنة فترة دقيقة، مرّرها من UI إلى Server Action بدل placeholder.

---

### ✅ انتهى
افتح هذا الملف داخل VS Code، وابدأ بتنفيذ الـ checklist خطوة-بخطوة.
