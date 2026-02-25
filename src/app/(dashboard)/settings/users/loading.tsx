import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Quota bar */}
      <Skeleton className="h-12 w-full rounded-lg" />

      {/* Table */}
      <div className="rounded-lg border">
        {/* Table header */}
        <div className="border-b p-4">
          <div className="grid grid-cols-6 gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b p-4 last:border-b-0">
            <div className="grid grid-cols-6 gap-4 items-center">
              {/* User (avatar + name) */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              {/* Email */}
              <Skeleton className="h-4 w-32" />
              {/* Role */}
              <Skeleton className="h-5 w-16 rounded-full" />
              {/* Status */}
              <Skeleton className="h-5 w-14 rounded-full" />
              {/* Leads */}
              <Skeleton className="h-4 w-8" />
              {/* Last Login */}
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
