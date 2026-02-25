"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Operator } from "@/types/analytics";

type DateFilterInputProps = {
  operator: Operator;
  value?: string;
  value2?: string;
  onValueChange: (v: string) => void;
  onValue2Change: (v: string) => void;
};

function DatePicker({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-8 w-[150px] justify-start text-xs font-normal"
        >
          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
          {date ? format(date, "MMM d, yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) {
              onChange(d.toISOString());
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export function DateFilterInput({
  operator,
  value,
  value2,
  onValueChange,
  onValue2Change,
}: DateFilterInputProps) {
  // Presets don't need value input
  if (
    ["last7days", "last30days", "thisMonth", "thisYear"].includes(
      operator as string
    )
  ) {
    return null;
  }

  if (operator === "between") {
    return (
      <div className="flex items-center gap-1.5">
        <DatePicker
          value={value}
          onChange={onValueChange}
          placeholder="From..."
        />
        <span className="text-xs text-muted-foreground">to</span>
        <DatePicker
          value={value2}
          onChange={onValue2Change}
          placeholder="To..."
        />
      </div>
    );
  }

  return (
    <DatePicker
      value={value}
      onChange={onValueChange}
      placeholder={operator === "after" ? "After..." : "Before..."}
    />
  );
}
