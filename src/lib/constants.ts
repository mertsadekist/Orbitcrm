import type { LeadStatusValue } from "@/types/lead";
import type { DealStageValue } from "@/types/deal";

// ─── Lead Status Config ─────────────────────────────────

export type StatusConfig = {
  label: string;
  colorClass: string;
  textClass: string;
  bgClass: string;
  dotClass: string;
};

export const LEAD_STATUSES: Record<LeadStatusValue, StatusConfig> = {
  NEW: {
    label: "New",
    colorClass: "border-blue-300 dark:border-blue-700",
    textClass: "text-blue-700 dark:text-blue-400",
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
    dotClass: "bg-blue-500",
  },
  CONTACTED: {
    label: "Contacted",
    colorClass: "border-amber-300 dark:border-amber-700",
    textClass: "text-amber-700 dark:text-amber-400",
    bgClass: "bg-amber-100 dark:bg-amber-900/30",
    dotClass: "bg-amber-500",
  },
  QUALIFIED: {
    label: "Qualified",
    colorClass: "border-green-300 dark:border-green-700",
    textClass: "text-green-700 dark:text-green-400",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    dotClass: "bg-green-500",
  },
  UNQUALIFIED: {
    label: "Unqualified",
    colorClass: "border-red-300 dark:border-red-700",
    textClass: "text-red-700 dark:text-red-400",
    bgClass: "bg-red-100 dark:bg-red-900/30",
    dotClass: "bg-red-500",
  },
  CONVERTED: {
    label: "Converted",
    colorClass: "border-purple-300 dark:border-purple-700",
    textClass: "text-purple-700 dark:text-purple-400",
    bgClass: "bg-purple-100 dark:bg-purple-900/30",
    dotClass: "bg-purple-500",
  },
};

export const ALL_STATUSES: LeadStatusValue[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "UNQUALIFIED",
  "CONVERTED",
];

// ─── Score Colors ───────────────────────────────────────

export const SCORE_COLORS = [
  { max: 40, textClass: "text-red-700 dark:text-red-400", bgClass: "bg-red-100 dark:bg-red-900/30" },
  { max: 70, textClass: "text-amber-700 dark:text-amber-400", bgClass: "bg-amber-100 dark:bg-amber-900/30" },
  { max: 100, textClass: "text-green-700 dark:text-green-400", bgClass: "bg-green-100 dark:bg-green-900/30" },
];

// ─── Deal Stage Config ─────────────────────────────────

export type DealStageConfig = {
  label: string;
  colorClass: string;
  textClass: string;
  bgClass: string;
  dotClass: string;
  probability: number;
};

export const DEAL_STAGES: Record<DealStageValue, DealStageConfig> = {
  PROSPECTING: {
    label: "Prospecting",
    colorClass: "border-sky-300 dark:border-sky-700",
    textClass: "text-sky-700 dark:text-sky-400",
    bgClass: "bg-sky-100 dark:bg-sky-900/30",
    dotClass: "bg-sky-500",
    probability: 10,
  },
  QUALIFICATION: {
    label: "Qualification",
    colorClass: "border-indigo-300 dark:border-indigo-700",
    textClass: "text-indigo-700 dark:text-indigo-400",
    bgClass: "bg-indigo-100 dark:bg-indigo-900/30",
    dotClass: "bg-indigo-500",
    probability: 25,
  },
  PROPOSAL: {
    label: "Proposal",
    colorClass: "border-amber-300 dark:border-amber-700",
    textClass: "text-amber-700 dark:text-amber-400",
    bgClass: "bg-amber-100 dark:bg-amber-900/30",
    dotClass: "bg-amber-500",
    probability: 50,
  },
  NEGOTIATION: {
    label: "Negotiation",
    colorClass: "border-orange-300 dark:border-orange-700",
    textClass: "text-orange-700 dark:text-orange-400",
    bgClass: "bg-orange-100 dark:bg-orange-900/30",
    dotClass: "bg-orange-500",
    probability: 75,
  },
  CLOSED_WON: {
    label: "Closed Won",
    colorClass: "border-green-300 dark:border-green-700",
    textClass: "text-green-700 dark:text-green-400",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    dotClass: "bg-green-500",
    probability: 100,
  },
  CLOSED_LOST: {
    label: "Closed Lost",
    colorClass: "border-red-300 dark:border-red-700",
    textClass: "text-red-700 dark:text-red-400",
    bgClass: "bg-red-100 dark:bg-red-900/30",
    dotClass: "bg-red-500",
    probability: 0,
  },
};

export const ALL_DEAL_STAGES: DealStageValue[] = [
  "PROSPECTING",
  "QUALIFICATION",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
];
