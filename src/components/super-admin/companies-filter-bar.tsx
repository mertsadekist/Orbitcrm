"use client";

import { useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { CompanyFilters } from "@/actions/super-admin/get-companies";

type FilterBarProps = {
  filters: CompanyFilters;
  onFilterChange: (filters: CompanyFilters) => void;
};

export function CompaniesFilterBar({
  filters,
  onFilterChange,
}: FilterBarProps) {
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateFilter(
    key: keyof CompanyFilters,
    value: string | undefined
  ) {
    onFilterChange({ ...filters, [key]: value, page: 1 });
  }

  function handleSearchChange(value: string) {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      updateFilter("search", value || undefined);
    }, 300);
  }

  function clearFilters() {
    onFilterChange({ page: 1, pageSize: filters.pageSize });
  }

  const hasActiveFilters =
    filters.search ||
    filters.plan ||
    filters.isActive !== undefined;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Search</Label>
        <Input
          placeholder="Search companies..."
          className="w-[220px]"
          defaultValue={filters.search ?? ""}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Plan</Label>
        <Select
          value={filters.plan ?? "ALL"}
          onValueChange={(v) => updateFilter("plan", v === "ALL" ? undefined : v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Plans</SelectItem>
            <SelectItem value="FREE">Free</SelectItem>
            <SelectItem value="STARTER">Starter</SelectItem>
            <SelectItem value="PROFESSIONAL">Professional</SelectItem>
            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Status</Label>
        <Select
          value={filters.isActive ?? "ALL"}
          onValueChange={(v) =>
            updateFilter(
              "isActive",
              v === "ALL" ? undefined : v
            )
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
