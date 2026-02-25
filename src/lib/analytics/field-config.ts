import type { FilterableField, Operator } from "@/types/analytics";

export const LEAD_STATUS = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "UNQUALIFIED",
  "CONVERTED",
] as const;

export const LEAD_SOURCE = ["quiz", "manual", "import"] as const;

export const DEAL_STAGE = [
  "PROSPECTING",
  "QUALIFICATION",
  "PROPOSAL",
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
  options?: readonly string[];
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
    operators: [
      "after",
      "before",
      "between",
      "last7days",
      "last30days",
      "thisMonth",
      "thisYear",
    ],
  },
  convertedAt: {
    label: "Converted Date",
    type: "date",
    operators: [
      "after",
      "before",
      "between",
      "last7days",
      "last30days",
      "thisMonth",
      "thisYear",
    ],
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
    operators: [
      "after",
      "before",
      "between",
      "last7days",
      "last30days",
      "thisMonth",
      "thisYear",
    ],
  },
};

export function getOperatorsForField(field: FilterableField): Operator[] {
  return FIELD_CONFIG[field].operators;
}

export function getInputTypeForOperator(
  field: FilterableField,
  operator: Operator
): InputType {
  const def = FIELD_CONFIG[field];

  if (def.type === "enum") return operator === "in" ? "multi-select" : "select";
  if (def.type === "number") return "number";
  if (def.type === "date") return operator === "between" ? "date-range" : "date";
  if (def.type === "relation") return "user-select";

  return "text";
}
