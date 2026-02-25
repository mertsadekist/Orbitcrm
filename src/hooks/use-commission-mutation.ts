"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateDealStage } from "@/actions/deal/update-deal-stage";
import { closeDeal } from "@/actions/deal/close-deal";
import {
  approveCommission,
  payCommission,
} from "@/actions/deal/commission-actions";
import type { DealStageValue, CloseDealFormData } from "@/types/deal";

function useInvalidateDeals() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["deals"] });
    qc.invalidateQueries({ queryKey: ["deal"] });
    qc.invalidateQueries({ queryKey: ["leads"] });
  };
}

export function useDealStageMutation() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: ({ dealId, stage }: { dealId: string; stage: DealStageValue }) =>
      updateDealStage(dealId, stage),
    onSuccess: (result) => {
      if (result.success) {
        const data = result.data;
        if ("requiresModal" in data) return; // caller handles modal
        toast.success("Stage updated");
        invalidate();
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Failed to update stage"),
  });
}

export function useCloseDealMutation() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: (data: CloseDealFormData) => closeDeal(data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Deal closed successfully!");
        invalidate();
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Failed to close deal"),
  });
}

export function useApproveCommission() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: (commissionId: string) => approveCommission(commissionId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Commission approved");
        invalidate();
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Failed to approve commission"),
  });
}

export function usePayCommission() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: (commissionId: string) => payCommission(commissionId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Commission marked as paid");
        invalidate();
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Failed to mark commission as paid"),
  });
}
