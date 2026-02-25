import { Skeleton } from "@/components/ui/skeleton";

export default function StatsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* KPI cards grid - 6 cols on lg */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      {/* Growth chart - full width */}
      <Skeleton className="h-[350px] w-full rounded-xl" />

      {/* Revenue + Plan distribution - 2 cols on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[300px] rounded-xl" />
        <Skeleton className="lg:col-span-1 h-[300px] rounded-xl" />
      </div>
    </div>
  );
}
