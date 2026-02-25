"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function KanbanCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
