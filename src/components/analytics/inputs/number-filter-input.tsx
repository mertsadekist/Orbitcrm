"use client";

import { Input } from "@/components/ui/input";
import type { Operator } from "@/types/analytics";

type NumberFilterInputProps = {
  operator: Operator;
  value?: string;
  value2?: string;
  onValueChange: (v: string) => void;
  onValue2Change: (v: string) => void;
};

export function NumberFilterInput({
  operator,
  value,
  value2,
  onValueChange,
  onValue2Change,
}: NumberFilterInputProps) {
  if (operator === "between") {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          className="h-8 w-[100px] text-xs"
          placeholder="Min"
          value={value ?? ""}
          onChange={(e) => onValueChange(e.target.value)}
        />
        <span className="text-xs text-muted-foreground">and</span>
        <Input
          type="number"
          className="h-8 w-[100px] text-xs"
          placeholder="Max"
          value={value2 ?? ""}
          onChange={(e) => onValue2Change(e.target.value)}
        />
      </div>
    );
  }

  return (
    <Input
      type="number"
      className="h-8 w-[140px] text-xs"
      placeholder="Value..."
      value={value ?? ""}
      onChange={(e) => onValueChange(e.target.value)}
    />
  );
}
