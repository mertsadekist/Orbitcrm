"use client";

import { useQueryState, parseAsInteger } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { CompanyUser } from "@/types/lead";

type LeadFilterBarProps = {
  companyUsers: CompanyUser[];
};

export function LeadFilterBar({ companyUsers }: LeadFilterBarProps) {
  const [assignee, setAssignee] = useQueryState("assignee");
  const [source, setSource] = useQueryState("source");
  const [scoreMin, setScoreMin] = useQueryState("scoreMin", parseAsInteger);
  const [scoreMax, setScoreMax] = useQueryState("scoreMax", parseAsInteger);

  const hasFilters = assignee || source || scoreMin != null || scoreMax != null;

  function clearAll() {
    setAssignee(null);
    setSource(null);
    setScoreMin(null);
    setScoreMax(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Assignee filter */}
      <Select
        value={assignee ?? "all"}
        onValueChange={(v) => setAssignee(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[180px]">
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

      {/* Source filter */}
      <Select
        value={source ?? "all"}
        onValueChange={(v) => setSource(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All sources" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          <SelectItem value="quiz">Quiz</SelectItem>
          <SelectItem value="manual">Manual</SelectItem>
          <SelectItem value="import">Import</SelectItem>
        </SelectContent>
      </Select>

      {/* Score range */}
      <Select
        value={
          scoreMin != null || scoreMax != null
            ? `${scoreMin ?? 0}-${scoreMax ?? 100}`
            : "all"
        }
        onValueChange={(v) => {
          if (v === "all") {
            setScoreMin(null);
            setScoreMax(null);
          } else {
            const [min, max] = v.split("-").map(Number);
            setScoreMin(min);
            setScoreMax(max);
          }
        }}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All scores" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All scores</SelectItem>
          <SelectItem value="0-40">Low (0-40)</SelectItem>
          <SelectItem value="41-70">Medium (41-70)</SelectItem>
          <SelectItem value="71-100">High (71-100)</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1">
          <X className="h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
