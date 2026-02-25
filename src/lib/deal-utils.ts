import { DEAL_STAGES } from "@/lib/constants";
import type { DealStageConfig } from "@/lib/constants";
import type { DealStageValue, CommissionSplit } from "@/types/deal";

export function calculateSplitAmount(
  totalValue: number,
  percentage: number
): number {
  return Math.round((totalValue * percentage) / 100 * 100) / 100;
}

export function calculateCompanyShare(
  totalValue: number,
  splits: CommissionSplit[]
): { percentage: number; amount: number } {
  const totalPct = splits.reduce((sum, s) => sum + s.percentage, 0);
  const companyPct = Math.max(0, 100 - totalPct);
  return {
    percentage: Math.round(companyPct * 100) / 100,
    amount: calculateSplitAmount(totalValue, companyPct),
  };
}

export function getDealStageConfig(stage: DealStageValue): DealStageConfig {
  return DEAL_STAGES[stage];
}

export function formatCurrency(
  amount: string | number,
  currency: string = "USD"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function getProbabilityForStage(stage: DealStageValue): number {
  const map: Record<DealStageValue, number> = {
    PROSPECTING: 10,
    QUALIFICATION: 25,
    PROPOSAL: 50,
    NEGOTIATION: 75,
    CLOSED_WON: 100,
    CLOSED_LOST: 0,
  };
  return map[stage];
}
