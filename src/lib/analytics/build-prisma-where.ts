import {
  subDays,
  startOfMonth,
  startOfYear,
  endOfMonth,
  endOfYear,
} from "date-fns";
import type { FilterRow } from "@/types/analytics";
import type { Prisma } from "@/generated/prisma/client";

function isEmpty(v?: string) {
  return !v || v.trim().length === 0;
}

function parseCSV(v?: string): string[] {
  if (isEmpty(v)) return [];
  return v!
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toNumber(v?: string): number | null {
  if (isEmpty(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function presetToDateRange(
  operator: string
): { gte?: Date; lte?: Date } | null {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildScalarCondition(row: FilterRow): any | null {
  const { operator, value, value2 } = row;

  // Date presets (no value needed)
  const preset = presetToDateRange(String(operator));
  if (preset) return preset;

  if (operator === "between") {
    if (isEmpty(value) || isEmpty(value2)) return null;
    const n1 = toNumber(value);
    const n2 = toNumber(value2);
    if (n1 !== null && n2 !== null) {
      return { gte: n1, lte: n2 };
    }
    // Try as dates
    const d1 = new Date(value!);
    const d2 = new Date(value2!);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      return { gte: d1, lte: d2 };
    }
    return null;
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
    return { contains: value };
  }

  if (operator === "startsWith") {
    if (isEmpty(value)) return null;
    return { startsWith: value };
  }

  // Number comparisons
  if (["gt", "gte", "lt", "lte"].includes(String(operator))) {
    const n = toNumber(value);
    if (n === null) return null;
    return { [operator]: n };
  }

  // Date comparisons
  if (operator === "after") {
    if (isEmpty(value)) return null;
    const d = new Date(value!);
    if (isNaN(d.getTime())) return null;
    return { gte: d };
  }

  if (operator === "before") {
    if (isEmpty(value)) return null;
    const d = new Date(value!);
    if (isNaN(d.getTime())) return null;
    return { lte: d };
  }

  return null;
}

export function buildPrismaWhere(
  filters: FilterRow[],
  companyId: string
): { leadWhere: Prisma.LeadWhereInput; dealWhere: Prisma.DealWhereInput } {
  const and: Prisma.LeadWhereInput[] = [];

  // Tenant isolation — always enforced
  and.push({ companyId });

  for (const row of filters) {
    if (!row?.field) continue;

    // deal.* fields → deals: { some: { ... } }
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

    // Lead scalar fields
    const cond = buildScalarCondition(row);
    if (!cond) continue;

    and.push({ [row.field]: cond } as Prisma.LeadWhereInput);
  }

  const leadWhere: Prisma.LeadWhereInput = { AND: and };

  // dealWhere for direct deal aggregations (tenant-scoped via lead relation)
  const dealWhere: Prisma.DealWhereInput = {
    lead: { companyId },
  };

  return { leadWhere, dealWhere };
}
