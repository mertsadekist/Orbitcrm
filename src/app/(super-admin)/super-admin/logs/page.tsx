import type { Metadata } from "next";
import { getSystemLogs, type LogFilters } from "@/actions/super-admin/get-system-logs";
import { SystemLogsClient } from "@/components/super-admin/system-logs-client";

export const metadata: Metadata = {
  title: "System Logs | OrbitFlow Admin",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SystemLogsPage({ searchParams }: Props) {
  const params = await searchParams;

  const filters: LogFilters = {
    level: (params.level as string) || undefined,
    source: (params.source as string) || undefined,
    dateFrom: (params.dateFrom as string) || undefined,
    dateTo: (params.dateTo as string) || undefined,
    page: params.page ? Number(params.page) : 1,
    pageSize: 50,
  };

  const result = await getSystemLogs(filters);

  const initialData = result.success
    ? result.data
    : { logs: [], total: 0, page: 1, pageSize: 50, totalPages: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Logs</h1>
        <p className="text-sm text-muted-foreground">
          Monitor application errors, warnings, and system events in real-time.
        </p>
      </div>
      <SystemLogsClient initialData={initialData} initialFilters={filters} />
    </div>
  );
}
