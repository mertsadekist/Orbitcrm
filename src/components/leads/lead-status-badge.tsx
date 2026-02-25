"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStatusConfig } from "@/lib/lead-utils";
import type { LeadStatusValue } from "@/types/lead";

export function LeadStatusBadge({ status }: { status: LeadStatusValue }) {
  const config = getStatusConfig(status);

  return (
    <Badge
      variant="secondary"
      className={cn(config.bgClass, config.textClass, "font-medium")}
    >
      {config.label}
    </Badge>
  );
}
