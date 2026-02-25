import { formatDistanceToNowStrict } from "date-fns";
import { LEAD_STATUSES, SCORE_COLORS, ALL_STATUSES } from "@/lib/constants";
import type { StatusConfig } from "@/lib/constants";
import type { LeadStatusValue, SerializedLead } from "@/types/lead";

export function getScoreColor(score: number | null): {
  textClass: string;
  bgClass: string;
} {
  const s = score ?? 0;
  for (const tier of SCORE_COLORS) {
    if (s <= tier.max) return { textClass: tier.textClass, bgClass: tier.bgClass };
  }
  return { textClass: SCORE_COLORS[2].textClass, bgClass: SCORE_COLORS[2].bgClass };
}

export function getStatusConfig(status: LeadStatusValue): StatusConfig {
  return LEAD_STATUSES[status];
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNowStrict(new Date(dateStr), { addSuffix: true });
}

export function groupLeadsByStatus(
  leads: SerializedLead[]
): Record<LeadStatusValue, SerializedLead[]> {
  const grouped = {} as Record<LeadStatusValue, SerializedLead[]>;
  for (const status of ALL_STATUSES) {
    grouped[status] = [];
  }
  for (const lead of leads) {
    grouped[lead.status].push(lead);
  }
  return grouped;
}
