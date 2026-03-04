"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import type { CompanyUser } from "@/types/lead";

type LeadFilterBarProps = {
  companyUsers: CompanyUser[];
  campaigns: string[];
};

const SOURCES = [
  { value: "quiz",      label: "Quiz" },
  { value: "manual",    label: "Manual" },
  { value: "import",    label: "Import" },
  { value: "website",   label: "Website" },
  { value: "referral",  label: "Referral" },
  { value: "social",    label: "Social" },
  { value: "cold_call", label: "Cold Call" },
];

const STATUSES = [
  { value: "NEW",          label: "New" },
  { value: "CONTACTED",    label: "Contacted" },
  { value: "QUALIFIED",    label: "Qualified" },
  { value: "UNQUALIFIED",  label: "Unqualified" },
  { value: "CONVERTED",    label: "Converted" },
];

const DATE_RANGES = [
  { value: "today", label: "Today" },
  { value: "week",  label: "Last 7 days" },
  { value: "month", label: "This month" },
  { value: "30d",   label: "Last 30 days" },
  { value: "90d",   label: "Last 90 days" },
];

export function LeadFilterBar({ companyUsers, campaigns }: LeadFilterBarProps) {
  // URL-bound filter state (nuqs)
  const [search,    setSearch]    = useQueryState("q");
  const [assignee,  setAssignee]  = useQueryState("assignee");
  const [status,    setStatus]    = useQueryState("status");
  const [source,    setSource]    = useQueryState("source");
  const [scoreMin,  setScoreMin]  = useQueryState("scoreMin", parseAsInteger);
  const [scoreMax,  setScoreMax]  = useQueryState("scoreMax", parseAsInteger);
  const [dateRange, setDateRange] = useQueryState("dateRange");
  const [campaign,  setCampaign]  = useQueryState("campaign");

  // Local search value for debouncing
  const [localSearch, setLocalSearch] = useState(search ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync local search if URL param changes externally (e.g. back/forward)
  useEffect(() => {
    setLocalSearch(search ?? "");
  }, [search]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void setSearch(value.trim() || null);
      }, 300);
    },
    [setSearch]
  );

  // Count active filters for badge
  const activeCount = [
    !!search,
    !!assignee,
    !!status,
    !!source,
    scoreMin != null || scoreMax != null,
    !!dateRange,
    !!campaign,
  ].filter(Boolean).length;

  const hasFilters = activeCount > 0;

  function clearAll() {
    clearTimeout(debounceRef.current);
    setLocalSearch("");
    void setSearch(null);
    void setAssignee(null);
    void setStatus(null);
    void setSource(null);
    void setScoreMin(null);
    void setScoreMax(null);
    void setDateRange(null);
    void setCampaign(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">

      {/* ── Search ─────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-8 pr-7 w-[200px] h-9"
          placeholder="Search leads..."
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        {localSearch && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Assignee ───────────────────────────────────────── */}
      <Select
        value={assignee ?? "all"}
        onValueChange={(v) => void setAssignee(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="All assignees" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All assignees</SelectItem>
          {companyUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ── Status ─────────────────────────────────────────── */}
      <Select
        value={status ?? "all"}
        onValueChange={(v) => void setStatus(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ── Source ─────────────────────────────────────────── */}
      <Select
        value={source ?? "all"}
        onValueChange={(v) => void setSource(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[130px] h-9">
          <SelectValue placeholder="All sources" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          {SOURCES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ── Score range ────────────────────────────────────── */}
      <Select
        value={
          scoreMin != null || scoreMax != null
            ? `${scoreMin ?? 0}-${scoreMax ?? 100}`
            : "all"
        }
        onValueChange={(v) => {
          if (v === "all") {
            void setScoreMin(null);
            void setScoreMax(null);
          } else {
            const [min, max] = v.split("-").map(Number);
            void setScoreMin(min);
            void setScoreMax(max);
          }
        }}
      >
        <SelectTrigger className="w-[150px] h-9">
          <SelectValue placeholder="All scores" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All scores</SelectItem>
          <SelectItem value="0-40">Low (0–40)</SelectItem>
          <SelectItem value="41-70">Medium (41–70)</SelectItem>
          <SelectItem value="71-100">High (71–100)</SelectItem>
        </SelectContent>
      </Select>

      {/* ── Date range ─────────────────────────────────────── */}
      <Select
        value={dateRange ?? "all"}
        onValueChange={(v) => void setDateRange(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="All time" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All time</SelectItem>
          {DATE_RANGES.map((d) => (
            <SelectItem key={d.value} value={d.value}>
              {d.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ── Campaign (only if any exist in DB) ─────────────── */}
      {campaigns.length > 0 && (
        <Select
          value={campaign ?? "all"}
          onValueChange={(v) => void setCampaign(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="All campaigns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All campaigns</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* ── Clear all ──────────────────────────────────────── */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="h-9 gap-1.5">
          <X className="h-3.5 w-3.5" />
          Clear
          <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] leading-none">
            {activeCount}
          </Badge>
        </Button>
      )}
    </div>
  );
}
