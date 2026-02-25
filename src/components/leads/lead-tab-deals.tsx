"use client";

import { Handshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/lead-utils";
import type { FullLead } from "@/types/lead";

type LeadTabDealsProps = {
  deals: FullLead["deals"];
  onCreateDeal?: () => void;
};

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function LeadTabDeals({ deals, onCreateDeal }: LeadTabDealsProps) {
  if (!deals || deals.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Handshake className="mb-2 h-8 w-8" />
          <p className="text-sm">No deals yet</p>
        </div>

        <Button variant="outline" className="w-full" onClick={onCreateDeal}>
          Create Deal
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {deals.map((deal) => (
          <div
            key={deal.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">{deal.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(deal.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {deal.stage}
              </Badge>
              <span className="text-sm font-semibold">
                {formatCurrency(deal.value)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full" onClick={onCreateDeal}>
        Create Deal
      </Button>
    </div>
  );
}
