"use client";

import { useQuery } from "@tanstack/react-query";
import { getDeals, getDealById } from "@/actions/deal/deal-crud";
import type { DealFilters } from "@/types/deal";

export function useDeals(filters?: DealFilters) {
  return useQuery({
    queryKey: ["deals", filters],
    queryFn: async () => {
      const result = await getDeals(filters);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30_000,
  });
}

export function useDeal(dealId: string | null) {
  return useQuery({
    queryKey: ["deal", dealId],
    queryFn: async () => {
      const result = await getDealById(dealId!);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!dealId,
    staleTime: 30_000,
  });
}
