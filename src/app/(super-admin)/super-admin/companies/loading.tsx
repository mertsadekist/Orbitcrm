import { Skeleton } from "@/components/ui/skeleton";

export default function CompaniesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        {/* Table header */}
        <div className="border-b p-4">
          <div className="grid grid-cols-7 gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Table rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="border-b p-4 last:border-b-0">
            <div className="grid grid-cols-7 gap-4 items-center">
              {/* Company name + slug */}
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              {/* Plan */}
              <Skeleton className="h-5 w-20 rounded-full" />
              {/* Status */}
              <Skeleton className="h-5 w-14 rounded-full" />
              {/* Users */}
              <Skeleton className="h-4 w-12" />
              {/* Leads */}
              <Skeleton className="h-4 w-8" />
              {/* Revenue */}
              <Skeleton className="h-4 w-20" />
              {/* Actions */}
              <Skeleton className="h-8 w-8 rounded" />
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
