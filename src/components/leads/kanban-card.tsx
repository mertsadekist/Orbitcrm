"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Mail, Phone } from "lucide-react";
import { formatRelativeTime } from "@/lib/lead-utils";
import { LeadScoreBadge } from "./lead-score-badge";
import { LeadSourceBadge } from "./lead-source-badge";
import type { SerializedLead } from "@/types/lead";

type KanbanCardProps = {
  lead: SerializedLead;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  isDragOverlay?: boolean;
};

export function KanbanCard({
  lead,
  isSelected,
  onSelect,
  onClick,
  isDragOverlay,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: { status: lead.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const name =
    lead.firstName || lead.lastName
      ? `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim()
      : "Unnamed Lead";

  const assigneeInitials = lead.assignedTo
    ? `${lead.assignedTo.firstName.charAt(0)}${lead.assignedTo.lastName.charAt(0)}`
    : null;

  return (
    <Card
      ref={setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-shadow",
        isDragging && "opacity-30",
        isDragOverlay && "rotate-2 shadow-lg scale-105",
        isSelected && "ring-2 ring-primary"
      )}
    >
      <CardContent className="p-3 space-y-2">
        {/* Top row: checkbox + name */}
        <div className="flex items-start gap-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect()}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5"
          />
          <button
            type="button"
            className="flex-1 text-left"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <p className="text-sm font-medium leading-tight truncate">{name}</p>
            {lead.companyName && (
              <p className="text-xs text-muted-foreground truncate">
                {lead.companyName}
              </p>
            )}
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <LeadScoreBadge score={lead.score} />
          <LeadSourceBadge source={lead.source} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {assigneeInitials ? (
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px]">
                  {assigneeInitials}
                </AvatarFallback>
              </Avatar>
            ) : (
              <span className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/30" />
            )}
            <div className="flex gap-1">
              {lead.phone && <Phone className="h-3 w-3 text-muted-foreground" />}
              {lead.email && <Mail className="h-3 w-3 text-muted-foreground" />}
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {formatRelativeTime(lead.createdAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
