"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getScoreColor } from "@/lib/lead-utils";

export function LeadScoreBadge({ score }: { score: number | null }) {
  const s = score ?? 0;
  const { textClass, bgClass } = getScoreColor(s);

  return (
    <Badge variant="secondary" className={cn(bgClass, textClass, "font-medium")}>
      {s}%
    </Badge>
  );
}
