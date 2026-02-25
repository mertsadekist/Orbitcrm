"use client";

import { formatCurrency } from "@/lib/deal-utils";

type CompanyShareDisplayProps = {
  totalValue: number;
  totalSplitPercentage: number;
};

export function CompanyShareDisplay({
  totalValue,
  totalSplitPercentage,
}: CompanyShareDisplayProps) {
  const companyPct = Math.max(0, 100 - totalSplitPercentage);
  const companyAmount = Math.round((totalValue * companyPct) / 100 * 100) / 100;

  return (
    <div className="flex items-center justify-between rounded-md border border-dashed px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Company Share</span>
        <span className="text-sm text-muted-foreground">
          ({Math.round(companyPct * 100) / 100}%)
        </span>
      </div>
      <span className="text-sm font-semibold">
        {formatCurrency(companyAmount)}
      </span>
    </div>
  );
}