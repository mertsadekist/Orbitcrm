"use client";

type UserQuotaBarProps = {
  activeCount: number;
  maxUsers: number;
};

export function UserQuotaBar({ activeCount, maxUsers }: UserQuotaBarProps) {
  const percentage = maxUsers > 0 ? (activeCount / maxUsers) * 100 : 0;

  const barColor =
    percentage >= 90
      ? "bg-red-500"
      : percentage >= 70
        ? "bg-amber-500"
        : "bg-green-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {activeCount} of {maxUsers} users active
        </span>
        {percentage >= 90 && (
          <span className="text-xs text-red-600 dark:text-red-400">
            Quota almost full
          </span>
        )}
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={"h-full rounded-full transition-all " + barColor}
          style={{ width: Math.min(percentage, 100) + "%" }}
        />
      </div>
    </div>
  );
}
