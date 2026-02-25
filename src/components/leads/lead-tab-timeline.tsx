"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeadTimeline } from "@/actions/leads/get-lead-timeline";
import { formatRelativeTime } from "@/lib/lead-utils";

type TimelineEntry = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues: unknown;
  newValues: unknown;
  userId: string;
  userName: string | null;
  createdAt: string;
};

type LeadTabTimelineProps = {
  leadId: string;
};

function formatValues(values: unknown): string | null {
  if (!values || (typeof values === "object" && Object.keys(values as object).length === 0)) {
    return null;
  }
  try {
    return JSON.stringify(values, null, 2);
  } catch {
    return null;
  }
}

export function LeadTabTimeline({ leadId }: LeadTabTimelineProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["lead-timeline", leadId],
    queryFn: async () => {
      const result = await getLeadTimeline(leadId);
      if (!result.success) throw new Error(result.error);
      return result.data as TimelineEntry[];
    },
    enabled: !!leadId,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-3 w-3 rounded-full mt-1.5 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Clock className="mb-2 h-8 w-8" />
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />

      {data.map((entry) => {
        const oldStr = formatValues(entry.oldValues);
        const newStr = formatValues(entry.newValues);

        return (
          <div key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Dot */}
            <div className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />

            {/* Content */}
            <div className="flex-1 space-y-1">
              <p className="text-sm">
                <span className="font-medium">{entry.action}</span>
                {entry.userName && (
                  <span className="text-muted-foreground">
                    {" "}
                    by {entry.userName}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(entry.createdAt)}
              </p>

              {/* Old/new values */}
              {(oldStr || newStr) && (
                <div className="mt-1 space-y-1">
                  {oldStr && (
                    <pre className="text-xs text-muted-foreground bg-muted rounded p-2 overflow-x-auto">
                      <span className="font-medium">Old:</span> {oldStr}
                    </pre>
                  )}
                  {newStr && (
                    <pre className="text-xs text-muted-foreground bg-muted rounded p-2 overflow-x-auto">
                      <span className="font-medium">New:</span> {newStr}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
