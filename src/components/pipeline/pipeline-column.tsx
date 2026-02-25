"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DEAL_STAGES } from "@/lib/constants";
import { formatCurrency } from "@/lib/deal-utils";
import { PipelineCard } from "./pipeline-card";
import type { SerializedDeal, DealStageValue } from "@/types/deal";

type PipelineColumnProps = {
  stage: DealStageValue;
  deals: SerializedDeal[];
  onCardClick: (dealId: string) => void;
};

export function PipelineColumn({ stage, deals, onCardClick }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const config = DEAL_STAGES[stage];

  const totalValue = deals.reduce(
    (sum, d) => sum + parseFloat(d.value),
    0
  );

  const isClosed = stage === "CLOSED_WON" || stage === "CLOSED_LOST";
  const tintClass = stage === "CLOSED_WON"
    ? "bg-green-50/50 dark:bg-green-950/20"
    : stage === "CLOSED_LOST"
      ? "bg-red-50/50 dark:bg-red-950/20"
      : "bg-muted/30";

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg border ${tintClass} ${
        isOver ? "ring-2 ring-primary/30" : ""
      }`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 border-b px-3 py-2.5 ${config.colorClass}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${config.dotClass}`} />
        <span className="text-sm font-medium">{config.label}</span>
        <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-medium">
          {deals.length}
        </span>
      </div>

      {/* Value summary */}
      <div className="border-b px-3 py-1.5 text-xs text-muted-foreground">
        Total: {formatCurrency(totalValue)}
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1">
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 p-2" style={{ minHeight: 60 }}>
            {deals.map((deal) => (
              <PipelineCard
                key={deal.id}
                deal={deal}
                onClick={() => onCardClick(deal.id)}
                isDragDisabled={isClosed}
              />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}
