"use client";

import { useState, useEffect } from "react";
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
import { X, Search, SlidersHorizontal } from "lucide-react";
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
  { value: "NEW",         label: "New" },
  { value: "CONTACTED",   label: "Contacted" },
  { value: "QUALIFIED",   label: "Qualified" },
  { value: "UNQUALIFIED", label: "Unqualified" },
  { value: "CONVERTED",   label: "Converted" },
];

const DATE_RANGES = [
  { value: "today", label: "Today" },
  { value: "week",  label: "Last 7 days" },
  { value: "month", label: "This month" },
  { value: "30d",   label: "Last 30 days" },
  { value: "90d",   label: "Last 90 days" },
];

/** Encode scoreMin/Max as a single string for Select value */
function encodeScore(min: number | null, max: number | null): string {
  if (min == null && max == null) return "all";
  return `${min ?? 0}-${max ?? 100}`;
}

export function LeadFilterBar({ companyUsers, campaigns }: LeadFilterBarProps) {
  // ── Applied (URL-bound) state ─────────────────────────────────────────
  const [search,    setSearch]    = useQueryState("q");
  const [assignee,  setAssignee]  = useQueryState("assignee");
  const [status,    setStatus]    = useQueryState("status");
  const [source,    setSource]    = useQueryState("source");
  const [scoreMin,  setScoreMin]  = useQueryState("scoreMin", parseAsInteger);
  const [scoreMax,  setScoreMax]  = useQueryState("scoreMax", parseAsInteger);
  const [dateRange, setDateRange] = useQueryState("dateRange");
  const [campaign,  setCampaign]  = useQueryState("campaign");

  // ── Pending (local) state — what the user is staging before Apply ─────
  const [pSearch,    setPSearch]    = useState(search ?? "");
  const [pAssignee,  setPAssignee]  = useState(assignee ?? "all");
  const [pStatus,    setPStatus]    = useState(status ?? "all");
  const [pSource,    setPSource]    = useState(source ?? "all");
  const [pScore,     setPScore]     = useState(encodeScore(scoreMin, scoreMax));
  const [pDateRange, setPDateRange] = useState(dateRange ?? "all");
  const [pCampaign,  setPCampaign]  = useState(campaign ?? "all");

  // Sync pending state when URL changes externally (browser back/forward)
  useEffect(() => {
    setPSearch(search ?? "");
    setPAssignee(assignee ?? "all");
    setPStatus(status ?? "all");
    setPSource(source ?? "all");
    setPScore(encodeScore(scoreMin, scoreMax));
    setPDateRange(dateRange ?? "all");
    setPCampaign(campaign ?? "all");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, assignee, status, source, scoreMin, scoreMax, dateRange, campaign]);

  // ── Derived state ─────────────────────────────────────────────────────
  const appliedScore = encodeScore(scoreMin, scoreMax);

  /** True when pending values differ from what's currently in the URL */
  const hasUnapplied =
    pSearch    !== (search ?? "")         ||
    pAssignee  !== (assignee ?? "all")    ||
    pStatus    !== (status ?? "all")      ||
    pSource    !== (source ?? "all")      ||
    pScore     !== appliedScore           ||
    pDateRange !== (dateRange ?? "all")   ||
    pCampaign  !== (campaign ?? "all");

  /** Count of currently applied (URL) filters */
  const appliedCount = [
    !!search,
    !!assignee,
    !!status,
    !!source,
    scoreMin != null || scoreMax != null,
    !!dateRange,
    !!campaign,
  ].filter(Boolean).length;

  // ── Handlers ──────────────────────────────────────────────────────────
  function handleApply() {
    void setSearch(pSearch.trim() || null);
    void setAssignee(pAssignee  === "all" ? null : pAssignee);
    void setStatus(pStatus    === "all" ? null : pStatus);
    void setSource(pSource    === "all" ? null : pSource);
    if (pScore === "all") {
      void setScoreMin(null);
      void setScoreMax(null);
    } else {
      const [min, max] = pScore.split("-").map(Number);
      void setScoreMin(min);
      void setScoreMax(max);
    }
    void setDateRange(pDateRange === "all" ? null : pDateRange);
    void setCampaign(pCampaign  === "all" ? null : pCampaign);
  }

  function handleClear() {
    // Reset pending
    setPSearch(""); setPAssignee("all"); setPStatus("all");
    setPSource("all"); setPScore("all"); setPDateRange("all"); setPCampaign("all");
    // Clear URL
    void setSearch(null); void setAssignee(null); void setStatus(null);
    void setSource(null); void setScoreMin(null); void setScoreMax(null);
    void setDateRange(null); void setCampaign(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">

      {/* ── Search ─────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-8 pr-7 w-[200px] h-9"
          placeholder="Search leads..."
          value={pSearch}
          onChange={(e) => setPSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
        />
        {pSearch && (
          <button
            onClick={() => setPSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Assignee ───────────────────────────────────────── */}
      <Select value={pAssignee} onValueChange={setPAssignee}>
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
      <Select value={pStatus} onValueChange={setPStatus}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ── Source ─────────────────────────────────────────── */}
      <Select value={pSource} onValueChange={setPSource}>
        <SelectTrigger className="w-[130px] h-9">
          <SelectValue placeholder="All sources" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          {SOURCES.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ── Score range ────────────────────────────────────── */}
      <Select value={pScore} onValueChange={setPScore}>
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
      <Select value={pDateRange} onValueChange={setPDateRange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="All time" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All time</SelectItem>
          {DATE_RANGES.map((d) => (
            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ── Campaign ───────────────────────────────────────── */}
      {campaigns.length > 0 && (
        <Select value={pCampaign} onValueChange={setPCampaign}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="All campaigns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All campaigns</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* ── Apply ──────────────────────────────────────────── */}
      <Button
        size="sm"
        className="h-9 gap-1.5"
        variant={hasUnapplied ? "default" : "outline"}
        onClick={handleApply}
        disabled={!hasUnapplied}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Apply
        {hasUnapplied && (
          <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-white/80" />
        )}
      </Button>

      {/* ── Clear ──────────────────────────────────────────── */}
      {appliedCount > 0 && (
        <Button variant="ghost" size="sm" onClick={handleClear} className="h-9 gap-1.5">
          <X className="h-3.5 w-3.5" />
          Clear
          <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] leading-none">
            {appliedCount}
          </Badge>
        </Button>
      )}
    </div>
  );
}
