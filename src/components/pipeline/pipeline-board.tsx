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
import { ALL_DEAL_STAGES } from "@/lib/constants";
import { updateDealStage } from "@/actions/deal/update-deal-stage";
import { PipelineColumn } from "./pipeline-column";
import { PipelineCard } from "./pipeline-card";
import { DealDetailsSheet } from "@/components/deals/deal-details-sheet";
import type { SerializedDeal, DealStageValue } from "@/types/deal";

type CompanyUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type PipelineBoardProps = {
  initialDeals: SerializedDeal[];
  companyUsers: CompanyUser[];
  currentUserRole: string;
};

function groupDealsByStage(deals: SerializedDeal[]) {
  const grouped: Record<DealStageValue, SerializedDeal[]> = {
    PROSPECTING: [],
    QUALIFICATION: [],
    PROPOSAL: [],
    NEGOTIATION: [],
    CLOSED_WON: [],
    CLOSED_LOST: [],
  };

  for (const deal of deals) {
    grouped[deal.stage].push(deal);
  }

  return grouped;
}

export function PipelineBoard({
  initialDeals,
  companyUsers,
  currentUserRole,
}: PipelineBoardProps) {
  const [dealsByStage, setDealsByStage] = useState(() =>
    groupDealsByStage(initialDeals)
  );
  const [activeCard, setActiveCard] = useState<SerializedDeal | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const snapshotRef = useRef(dealsByStage);

  // Fix hydration error: only enable DnD after client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Sync when initialDeals prop changes (SSR re-fetch)
  const prevDealsRef = useRef(initialDeals);
  if (prevDealsRef.current !== initialDeals) {
    prevDealsRef.current = initialDeals;
    setDealsByStage(groupDealsByStage(initialDeals));
  }

  const findStageForDeal = useCallback(
    (grouped: Record<DealStageValue, SerializedDeal[]>, dealId: string): DealStageValue | null => {
      for (const stage of ALL_DEAL_STAGES) {
        if (grouped[stage].some((d) => d.id === dealId)) return stage;
      }
      return null;
    },
    []
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string;
      const deal = Object.values(dealsByStage).flat().find((d) => d.id === id);
      if (deal) {
        // Don't allow dragging closed deals
        if (deal.stage === "CLOSED_WON" || deal.stage === "CLOSED_LOST") return;
        snapshotRef.current = { ...dealsByStage };
        setActiveCard(deal);
      }
    },
    [dealsByStage]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const sourceStage = findStageForDeal(dealsByStage, activeId);
      const targetStage = ALL_DEAL_STAGES.includes(overId as DealStageValue)
        ? (overId as DealStageValue)
        : findStageForDeal(dealsByStage, overId);

      if (!sourceStage || !targetStage || sourceStage === targetStage) return;

      setDealsByStage((prev) => {
        const next = { ...prev };
        const card = next[sourceStage].find((d) => d.id === activeId);
        if (!card) return prev;

        next[sourceStage] = next[sourceStage].filter((d) => d.id !== activeId);
        next[targetStage] = [{ ...card, stage: targetStage }, ...next[targetStage]];
        return next;
      });
    },
    [dealsByStage, findStageForDeal]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveCard(null);

      if (!over) {
        setDealsByStage(snapshotRef.current);
        return;
      }

      const activeId = active.id as string;
      const targetStage = ALL_DEAL_STAGES.includes(over.id as string as DealStageValue)
        ? (over.id as string as DealStageValue)
        : findStageForDeal(dealsByStage, over.id as string);

      if (!targetStage) {
        setDealsByStage(snapshotRef.current);
        return;
      }

      const originalStage = findStageForDeal(snapshotRef.current, activeId);
      if (!originalStage || originalStage === targetStage) return;

      // CLOSED_WON requires modal â€” revert (handled at higher level if needed)
      if (targetStage === "CLOSED_WON") {
        toast.info("Use the Close Deal modal to mark a deal as won");
        setDealsByStage(snapshotRef.current);
        return;
      }

      // CLOSED_LOST
      if (targetStage === "CLOSED_LOST") {
        const result = await updateDealStage(activeId, "CLOSED_LOST");
        if (!result.success) {
          toast.error(result.error);
          setDealsByStage(snapshotRef.current);
        }
        return;
      }

      // Normal stage change
      const result = await updateDealStage(activeId, targetStage);
      if (!result.success) {
        toast.error(result.error);
        setDealsByStage(snapshotRef.current);
      }
    },
    [dealsByStage, findStageForDeal]
  );

  const handleDragCancel = useCallback(() => {
    setActiveCard(null);
    setDealsByStage(snapshotRef.current);
  }, []);

  // Render content without DnD during SSR to avoid hydration mismatch
  if (!isMounted) {
    return (
      <>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ALL_DEAL_STAGES.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              deals={dealsByStage[stage]}
              onCardClick={setSelectedDealId}
            />
          ))}
        </div>

        <DealDetailsSheet
          dealId={selectedDealId}
          onClose={() => setSelectedDealId(null)}
          currentUserRole={currentUserRole}
        />
      </>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ALL_DEAL_STAGES.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              deals={dealsByStage[stage]}
              onCardClick={setSelectedDealId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard && (
            <PipelineCard
              deal={activeCard}
              onClick={() => {}}
              isDragOverlay
            />
          )}
        </DragOverlay>
      </DndContext>

      <DealDetailsSheet
        dealId={selectedDealId}
        onClose={() => setSelectedDealId(null)}
        currentUserRole={currentUserRole}
      />
    </>
  );
}