"use client";

import type { FilterableField, Operator } from "@/types/analytics";
import type { FieldDefinition } from "@/lib/analytics/field-config";
import { EnumFilterInput } from "@/components/analytics/inputs/enum-filter-input";
import { NumberFilterInput } from "@/components/analytics/inputs/number-filter-input";
import { DateFilterInput } from "@/components/analytics/inputs/date-filter-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type FilterValueInputProps = {
  field: FilterableField;
  fieldDef: FieldDefinition;
  operator: Operator;
  value?: string;
  value2?: string;
  companyUsers: { id: string; firstName: string; lastName: string }[];
  onValueChange: (v: string) => void;
  onValue2Change: (v: string) => void;
};

export function FilterValueInput({
  field,
  fieldDef,
  operator,
  value,
  value2,
  companyUsers,
  onValueChange,
  onValue2Change,
}: FilterValueInputProps) {
  // Enum fields (status, source, deal.stage)
  if (fieldDef.type === "enum" && fieldDef.options) {
    return (
      <EnumFilterInput
        options={fieldDef.options}
        isMulti={operator === "in"}
        value={value}
        onChange={onValueChange}
      />
    );
  }

  // Number fields (score, deal.value)
  if (fieldDef.type === "number") {
    return (
      <NumberFilterInput
        operator={operator}
        value={value}
        value2={value2}
        onValueChange={onValueChange}
        onValue2Change={onValue2Change}
      />
    );
  }

  // Date fields
  if (fieldDef.type === "date") {
    return (
      <DateFilterInput
        operator={operator}
        value={value}
        value2={value2}
        onValueChange={onValueChange}
        onValue2Change={onValue2Change}
      />
    );
  }

  // Relation fields (assignedToId)
  if (fieldDef.type === "relation") {
    return (
      <Select value={value ?? ""} onValueChange={onValueChange}>
        <SelectTrigger className="w-[180px] h-8 text-xs">
          <SelectValue placeholder="Select user" />
        </SelectTrigger>
        <SelectContent>
          {companyUsers.map((u) => (
            <SelectItem key={u.id} value={u.id} className="text-xs">
              {u.firstName} {u.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // String fields (tags)
  return (
    <Input
      className="h-8 w-[180px] text-xs"
      placeholder="Value..."
      value={value ?? ""}
      onChange={(e) => onValueChange(e.target.value)}
    />
  );
}
