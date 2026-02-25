"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

type EnumFilterInputProps = {
  options: readonly string[];
  isMulti: boolean;
  value?: string;
  onChange: (v: string) => void;
};

export function EnumFilterInput({
  options,
  isMulti,
  value,
  onChange,
}: EnumFilterInputProps) {
  if (!isMulti) {
    return (
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt} className="text-xs">
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Multi-select: comma-separated values
  const selected = value
    ? value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  function toggle(opt: string) {
    const next = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt];
    onChange(next.join(","));
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {selected.map((s) => (
        <Badge
          key={s}
          variant="secondary"
          className="text-xs cursor-pointer gap-1"
          onClick={() => toggle(s)}
        >
          {s}
          <X className="h-3 w-3" />
        </Badge>
      ))}
      <Select value="" onValueChange={toggle}>
        <SelectTrigger className="w-[120px] h-8 text-xs">
          <SelectValue placeholder="Add..." />
        </SelectTrigger>
        <SelectContent>
          {options
            .filter((opt) => !selected.includes(opt))
            .map((opt) => (
              <SelectItem key={opt} value={opt} className="text-xs">
                {opt}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
