"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SystemLogsFilterBar } from "./system-logs-filter-bar";
import { SystemLogsTable } from "./system-logs-table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getSystemLogs,
  type PaginatedLogs,
  type LogFilters,
} from "@/actions/super-admin/get-system-logs";

type SystemLogsClientProps = {
  initialData: PaginatedLogs;
  initialFilters: LogFilters;
};

export function SystemLogsClient({
  initialData,
  initialFilters,
}: SystemLogsClientProps) {
  const [data, setData] = useState<PaginatedLogs>(initialData);
  const [filters, setFilters] = useState<LogFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(async (currentFilters: LogFilters) => {
    setLoading(true);
    const result = await getSystemLogs(currentFilters);
    if (result.success) {
      setData(result.data);
    }
    setLoading(false);
  }, []);

  // Fetch on filter change
  useEffect(() => {
    fetchLogs(filters);
  }, [filters, fetchLogs]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchLogs(filters);
      }, 10_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, filters, fetchLogs]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.level && filters.level !== "ALL")
      params.set("level", filters.level);
    if (filters.source && filters.source !== "ALL")
      params.set("source", filters.source);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.page && filters.page > 1)
      params.set("page", String(filters.page));

    const qs = params.toString();
    const newUrl = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [filters]);

  return (
    <div className="space-y-4">
      <SystemLogsFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
      />

      <div className={loading ? "opacity-60 transition-opacity" : ""}>
        <SystemLogsTable logs={data.logs} />
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {data.page} of {data.totalPages} ({data.total} total)
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={data.page <= 1}
            onClick={() =>
              setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))
            }
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={data.page >= data.totalPages}
            onClick={() =>
              setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
            }
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
