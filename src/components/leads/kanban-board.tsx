"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { groupLeadsByStatus } from "@/lib/lead-utils";
import { ALL_STATUSES } from "@/lib/constants";
import { updateLeadStatus } from "@/actions/leads/update-lead-status";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { BulkActionsBar } from "./bulk-actions-bar";
import { LeadDetailsModal } from "./lead-details-modal";
import { CloseDealModal } from "@/components/deals/close-deal-modal";
import type { SerializedLead, LeadStatusValue, CompanyUser } from "@/types/lead";

type KanbanBoardProps = {
  initialLeads: SerializedLead[];
  companyUsers: CompanyUser[];
  currentUserRole: string;
  canBulkActions: boolean;
};

export function KanbanBoard({
  initialLeads,
  companyUsers,
  currentUserRole,
  canBulkActions,
}: KanbanBoardProps) {
  const [leadsByStatus, setLeadsByStatus] = useState(() =>
    groupLeadsByStatus(initialLeads)
  );
  const [activeCard, setActiveCard] = useState<SerializedLead | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [convertingLead, setConvertingLead] = useState<SerializedLead | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Snapshot for revert on error
  const snapshotRef = useRef(leadsByStatus);

  // Fix hydration error: only enable DnD after client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Update local state when initialLeads changes (SSR re-fetch)
  // We keep this simple — replace state when props change
  const prevLeadsRef = useRef(initialLeads);
  if (prevLeadsRef.current !== initialLeads) {
    prevLeadsRef.current = initialLeads;
    setLeadsByStatus(groupLeadsByStatus(initialLeads));
  }

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string;
      const lead = initialLeads.find((l) => l.id === id) ??
        Object.values(leadsByStatus).flat().find((l) => l.id === id);
      if (lead) {
        snapshotRef.current = { ...leadsByStatus };
        setActiveCard(lead);
      }
    },
    [initialLeads, leadsByStatus]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Determine source and target statuses
      const sourceStatus = findStatusForLead(leadsByStatus, activeId);
      const targetStatus = ALL_STATUSES.includes(overId as LeadStatusValue)
        ? (overId as LeadStatusValue)
        : findStatusForLead(leadsByStatus, overId);

      if (!sourceStatus || !targetStatus || sourceStatus === targetStatus) return;

      setLeadsByStatus((prev) => {
        const next = { ...prev };
        const card = next[sourceStatus].find((l) => l.id === activeId);
        if (!card) return prev;

        next[sourceStatus] = next[sourceStatus].filter((l) => l.id !== activeId);
        next[targetStatus] = [{ ...card, status: targetStatus }, ...next[targetStatus]];
        return next;
      });
    },
    [leadsByStatus]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveCard(null);

      if (!over) {
        // Cancelled — revert
        setLeadsByStatus(snapshotRef.current);
        return;
      }

      const activeId = active.id as string;
      const targetStatus = ALL_STATUSES.includes(over.id as string as LeadStatusValue)
        ? (over.id as string as LeadStatusValue)
        : findStatusForLead(leadsByStatus, over.id as string);

      if (!targetStatus) {
        setLeadsByStatus(snapshotRef.current);
        return;
      }

      // Check if status actually changed from snapshot
      const originalStatus = findStatusForLead(snapshotRef.current, activeId);
      if (!originalStatus || originalStatus === targetStatus) return;

      // Intercept CONVERTED — open Close Deal Modal instead
      if (targetStatus === "CONVERTED") {
        setLeadsByStatus(snapshotRef.current);
        const lead = initialLeads.find((l) => l.id === activeId) ??
          Object.values(snapshotRef.current).flat().find((l) => l.id === activeId);
        if (lead) {
          setConvertingLead(lead);
        }
        return;
      }

      // Fire server action
      const result = await updateLeadStatus(activeId, targetStatus);
      if (!result.success) {
        toast.error(result.error);
        setLeadsByStatus(snapshotRef.current);
      }
    },
    [leadsByStatus]
  );

  const handleDragCancel = useCallback(() => {
    setActiveCard(null);
    setLeadsByStatus(snapshotRef.current);
  }, []);

  const toggleSelectLead = useCallback((leadId: string) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  }, []);

  // Render content without DnD during SSR to avoid hydration mismatch
  if (!isMounted) {
    return (
      <>
        {selectedLeads.size > 0 && (
          <BulkActionsBar
            selectedLeads={selectedLeads}
            companyUsers={companyUsers}
            canBulkActions={canBulkActions}
            onClearSelection={() => setSelectedLeads(new Set())}
          />
        )}

        <div className="flex gap-4 overflow-x-auto pb-4">
          {ALL_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              leads={leadsByStatus[status]}
              selectedLeads={selectedLeads}
              onSelectLead={toggleSelectLead}
              onCardClick={setSelectedLeadId}
            />
          ))}
        </div>

        <LeadDetailsModal
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          companyUsers={companyUsers}
          userRole={currentUserRole}
        />

        <CloseDealModal
          lead={convertingLead}
          open={!!convertingLead}
          onClose={() => setConvertingLead(null)}
          companyUsers={companyUsers}
        />
      </>
    );
  }

  return (
    <>
      {selectedLeads.size > 0 && (
        <BulkActionsBar
          selectedLeads={selectedLeads}
          companyUsers={companyUsers}
          canBulkActions={canBulkActions}
          onClearSelection={() => setSelectedLeads(new Set())}
        />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ALL_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              leads={leadsByStatus[status]}
              selectedLeads={selectedLeads}
              onSelectLead={toggleSelectLead}
              onCardClick={setSelectedLeadId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard && (
            <KanbanCard
              lead={activeCard}
              isSelected={false}
              onSelect={() => {}}
              onClick={() => {}}
              isDragOverlay
            />
          )}
        </DragOverlay>
      </DndContext>

      <LeadDetailsModal
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        companyUsers={companyUsers}
        userRole={currentUserRole}
      />

      <CloseDealModal
        lead={convertingLead}
        open={!!convertingLead}
        onClose={() => setConvertingLead(null)}
        companyUsers={companyUsers}
      />
    </>
  );
}

function findStatusForLead(
  grouped: Record<LeadStatusValue, SerializedLead[]>,
  leadId: string
): LeadStatusValue | null {
  for (const status of ALL_STATUSES) {
    if (grouped[status].some((l) => l.id === leadId)) return status;
  }
  return null;
}
