"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { X, RefreshCw } from "lucide-react";
import type { LogFilters } from "@/actions/super-admin/get-system-logs";

type FilterBarProps = {
  filters: LogFilters;
  onFiltersChange: (filters: LogFilters) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (enabled: boolean) => void;
};

export function SystemLogsFilterBar({
  filters,
  onFiltersChange,
  autoRefresh,
  onAutoRefreshChange,
}: FilterBarProps) {
  function updateFilter(key: keyof LogFilters, value: string | undefined) {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  }

  function clearFilters() {
    onFiltersChange({ page: 1, pageSize: filters.pageSize });
  }

  const hasActiveFilters =
    (filters.level && filters.level !== "ALL") ||
    (filters.source && filters.source !== "ALL") ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Level</Label>
        <Select
          value={filters.level ?? "ALL"}
          onValueChange={(v) => updateFilter("level", v)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Levels</SelectItem>
            <SelectItem value="ERROR">ERROR</SelectItem>
            <SelectItem value="WARN">WARN</SelectItem>
            <SelectItem value="INFO">INFO</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Source</Label>
        <Select
          value={filters.source ?? "ALL"}
          onValueChange={(v) => updateFilter("source", v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Sources</SelectItem>
            <SelectItem value="SERVER_ACTION">SERVER_ACTION</SelectItem>
            <SelectItem value="API_ROUTE">API_ROUTE</SelectItem>
            <SelectItem value="MIDDLEWARE">MIDDLEWARE</SelectItem>
            <SelectItem value="CLIENT">CLIENT</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">From</Label>
        <Input
          type="datetime-local"
          className="w-[190px]"
          value={filters.dateFrom ?? ""}
          onChange={(e) => updateFilter("dateFrom", e.target.value || undefined)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">To</Label>
        <Input
          type="datetime-local"
          className="w-[190px]"
          value={filters.dateTo ?? ""}
          onChange={(e) => updateFilter("dateTo", e.target.value || undefined)}
        />
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      )}

      <div className="ml-auto flex items-center gap-2">
        <RefreshCw
          className={`h-4 w-4 text-muted-foreground ${autoRefresh ? "animate-spin" : ""}`}
        />
        <Label htmlFor="auto-refresh" className="text-xs cursor-pointer">
          Auto-refresh
        </Label>
        <Switch
          id="auto-refresh"
          checked={autoRefresh}
          onCheckedChange={onAutoRefreshChange}
        />
      </div>
    </div>
  );
}
