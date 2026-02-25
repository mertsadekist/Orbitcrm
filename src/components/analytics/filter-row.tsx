"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  FIELD_CONFIG,
  getOperatorsForField,
} from "@/lib/analytics/field-config";
import type { FilterRow, FilterableField, Operator } from "@/types/analytics";
import { FilterValueInput } from "@/components/analytics/filter-value-input";

const OPERATOR_LABELS: Record<string, string> = {
  equals: "equals",
  in: "is one of",
  contains: "contains",
  startsWith: "starts with",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  between: "between",
  after: "after",
  before: "before",
  last7days: "last 7 days",
  last30days: "last 30 days",
  thisMonth: "this month",
  thisYear: "this year",
};

type FilterRowCompProps = {
  row: FilterRow;
  companyUsers: { id: string; firstName: string; lastName: string }[];
  onRemove: () => void;
  onChange: (patch: Partial<FilterRow>) => void;
};

const fieldKeys = Object.keys(FIELD_CONFIG) as FilterableField[];

export function FilterRowComp({
  row,
  companyUsers,
  onRemove,
  onChange,
}: FilterRowCompProps) {
  const fieldDef = FIELD_CONFIG[row.field];
  const operators = getOperatorsForField(row.field);
  const isPreset = ["last7days", "last30days", "thisMonth", "thisYear"].includes(
    row.operator as string
  );

  function handleFieldChange(field: string) {
    const newField = field as FilterableField;
    const newOps = getOperatorsForField(newField);
    onChange({
      field: newField,
      operator: newOps[0],
      value: "",
      value2: undefined,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2">
      {/* Field select */}
      <Select value={row.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-[150px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fieldKeys.map((f) => (
            <SelectItem key={f} value={f} className="text-xs">
              {FIELD_CONFIG[f].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator select */}
      <Select
        value={row.operator as string}
        onValueChange={(op) =>
          onChange({ operator: op as Operator, value: "", value2: undefined })
        }
      >
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op} value={op} className="text-xs">
              {OPERATOR_LABELS[op] ?? op}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value input (hidden for date presets) */}
      {!isPreset && (
        <FilterValueInput
          field={row.field}
          fieldDef={fieldDef}
          operator={row.operator as Operator}
          value={row.value}
          value2={row.value2}
          companyUsers={companyUsers}
          onValueChange={(v) => onChange({ value: v })}
          onValue2Change={(v) => onChange({ value2: v })}
        />
      )}

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onRemove}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
