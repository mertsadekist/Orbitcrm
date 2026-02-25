"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DealAmountInputProps = {
  value: number | "";
  currency: string;
  onValueChange: (val: number) => void;
  onCurrencyChange: (val: string) => void;
  error?: string;
};

const CURRENCIES = ["USD", "EUR", "GBP", "SAR", "AED", "EGP"];

export function DealAmountInput({
  value,
  currency,
  onValueChange,
  onCurrencyChange,
  error,
}: DealAmountInputProps) {
  return (
    <div className="space-y-2">
      <Label>Deal Value</Label>
      <div className="flex gap-2">
        <Select value={currency} onValueChange={onCurrencyChange}>
          <SelectTrigger className="w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          min={0}
          step={0.01}
          placeholder="0.00"
          value={value}
          onChange={(e) => {
            const num = parseFloat(e.target.value);
            if (!isNaN(num)) onValueChange(num);
          }}
          className="flex-1"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
