import type { DealStage, CommissionStatus } from "@/generated/prisma/client";

// ─── Stage / Status Types ───────────────────────────────

export type DealStageValue = `${DealStage}`;
export type CommissionStatusValue = `${CommissionStatus}`;

// ─── Serialized Deal (RSC → Client) ────────────────────

export interface SerializedDeal {
  id: string;
  companyId: string;
  leadId: string;
  assignedToId: string;
  title: string;
  value: string; // Decimal serialized
  currency: string;
  stage: DealStageValue;
  probability: number;
  expectedCloseDate: string | null;
  closedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lead: {
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
  };
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
  };
  commissions?: SerializedCommission[];
}

// ─── Serialized Commission ──────────────────────────────

export interface SerializedCommission {
  id: string;
  dealId: string;
  userId: string;
  amount: string; // Decimal serialized
  percentage: number;
  status: CommissionStatusValue;
  paidAt: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string };
}

// ─── Form Types ─────────────────────────────────────────

export interface CommissionSplit {
  userId: string;
  label: string;
  percentage: number; // 0-100
  amount: number; // auto-calculated
}

export interface CloseDealFormData {
  leadId: string;
  title: string;
  value: number;
  currency: string;
  splits: CommissionSplit[];
}

// ─── Filters ────────────────────────────────────────────

export interface DealFilters {
  stage?: DealStageValue;
  assigneeId?: string;
  dateFrom?: string;
  dateTo?: string;
}
