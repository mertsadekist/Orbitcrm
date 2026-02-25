"use client";

import { useQuery } from "@tanstack/react-query";
import { getLeads, getLeadById } from "@/actions/leads/get-leads";
import type { LeadFilters } from "@/types/lead";

export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: ["leads", filters],
    queryFn: async () => {
      const result = await getLeads(filters);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30_000,
  });
}

export function useFullLead(leadId: string | null) {
  return useQuery({
    queryKey: ["lead", leadId],
    queryFn: async () => {
      const result = await getLeadById(leadId!);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!leadId,
    staleTime: 30_000,
  });
}
