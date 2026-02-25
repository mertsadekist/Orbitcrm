import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLogLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        {/* Table header */}
        <div className="border-b p-4">
          <div className="grid grid-cols-5 gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Table rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="border-b p-4 last:border-b-0">
            <div className="grid grid-cols-5 gap-4 items-center">
              {/* Time */}
              <Skeleton className="h-4 w-24" />
              {/* User */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              {/* Action */}
              <Skeleton className="h-5 w-16 rounded-full" />
              {/* Entity */}
              <Skeleton className="h-4 w-12" />
              {/* Details */}
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}
