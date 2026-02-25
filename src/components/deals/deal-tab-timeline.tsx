"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { getDealTimeline } from "@/actions/deal/get-deal-timeline";

type DealTabTimelineProps = {
  dealId: string;
};
export function DealTabTimeline({ dealId }: DealTabTimelineProps) {
  const { data: entries, isLoading } = useQuery({
    queryKey: ["deal-timeline", dealId],
    queryFn: async () => {
      const result = await getDealTimeline(dealId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30_000,
  });
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (!entries || entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No timeline entries yet.</p>
    );
  }
  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="flex gap-3 border-b pb-3 last:border-0">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
            {entry.user
              ? `${entry.user.firstName[0]}${entry.user.lastName[0]}`
              : "?"}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {formatAction(entry.action)}
            </p>
            {entry.newValues && (
              <p className="text-xs text-muted-foreground">
                {JSON.stringify(entry.newValues)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(entry.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
function formatAction(action: string): string {
  const map: Record<string, string> = {
    DEAL_CREATE: "Deal created",
    DEAL_UPDATE: "Deal updated",
    DEAL_CLOSE: "Deal closed",
    DEAL_STAGE_CHANGE: "Stage changed",
    DEAL_DELETE: "Deal deleted",
    COMMISSION_APPROVE: "Commission approved",
    COMMISSION_PAY: "Commission paid",
    COMMISSION_BULK_APPROVE: "Commissions bulk approved",
  };
  return map[action] ?? action;
}