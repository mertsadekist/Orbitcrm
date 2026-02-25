"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/deal-utils";
import type { SerializedDeal } from "@/types/deal";

type PipelineCardProps = {
  deal: SerializedDeal;
  onClick: () => void;
  isDragDisabled?: boolean;
  isDragOverlay?: boolean;
};

function getProbabilityColor(prob: number) {
  if (prob < 30) return "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
  if (prob <= 60) return "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30";
  return "text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
}

export function PipelineCard({
  deal,
  onClick,
  isDragDisabled = false,
  isDragOverlay = false,
}: PipelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const leadName = [deal.lead.firstName, deal.lead.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      style={!isDragOverlay ? style : undefined}
      {...(!isDragOverlay ? attributes : {})}
      {...(!isDragOverlay ? listeners : {})}
      onClick={onClick}
      className={`cursor-pointer rounded-lg border bg-card p-3 space-y-1.5 transition-shadow hover:shadow-md ${
        isDragOverlay ? "shadow-lg ring-2 ring-primary/20" : ""
      } ${isDragDisabled ? "opacity-80" : ""}`}
    >
      <p className="text-sm font-medium leading-tight line-clamp-2">
        {deal.title}
      </p>

      <p className="text-lg font-bold tracking-tight">
        {formatCurrency(deal.value, deal.currency)}
      </p>

      {leadName && (
        <p className="text-xs text-muted-foreground truncate">{leadName}</p>
      )}

      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={`text-xs ${getProbabilityColor(deal.probability)}`}
        >
          {deal.probability}%
        </Badge>
        {deal.assignedTo && (
          <span className="text-xs text-muted-foreground truncate">
            {deal.assignedTo.firstName} {deal.assignedTo.lastName}
          </span>
        )}
      </div>
    </div>
  );
}
