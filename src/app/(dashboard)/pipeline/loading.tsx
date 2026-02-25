import { Skeleton } from "@/components/ui/skeleton";
export default function PipelineLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      {/* Filters */}
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[180px]" />
        <Skeleton className="h-9 w-[160px]" />
      </div>
      {/* Pipeline columns */}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30"
          >
            <div className="flex items-center gap-2 border-b px-3 py-2.5">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="ml-auto h-5 w-6 rounded-full" />
            </div>
            <div className="border-b px-3 py-1.5">
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="space-y-2 p-2">
              {Array.from({ length: 2 - (i % 2) }).map((_, j) => (
                <div key={j} className="rounded-lg border bg-card p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-10 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}