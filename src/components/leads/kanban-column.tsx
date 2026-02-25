"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStatusConfig } from "@/lib/lead-utils";
import { KanbanCard } from "./kanban-card";
import type { LeadStatusValue, SerializedLead } from "@/types/lead";

type KanbanColumnProps = {
  status: LeadStatusValue;
  leads: SerializedLead[];
  selectedLeads: Set<string>;
  onSelectLead: (leadId: string) => void;
  onCardClick: (leadId: string) => void;
};

export function KanbanColumn({
  status,
  leads,
  selectedLeads,
  onSelectLead,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = getStatusConfig(status);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors",
        isOver && "ring-2 ring-primary/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <span className={cn("h-2.5 w-2.5 rounded-full", config.dotClass)} />
        <span className="text-sm font-medium">{config.label}</span>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 px-2 py-2" style={{ maxHeight: "calc(100vh - 260px)" }}>
        <div className="space-y-2">
          {leads.map((lead) => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              isSelected={selectedLeads.has(lead.id)}
              onSelect={() => onSelectLead(lead.id)}
              onClick={() => onCardClick(lead.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
