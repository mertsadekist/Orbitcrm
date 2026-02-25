"use client";

import { useQueryState } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ALL_DEAL_STAGES, DEAL_STAGES } from "@/lib/constants";

type CompanyUser = {
  id: string;
  firstName: string;
  lastName: string;
};

type PipelineFilterBarProps = {
  companyUsers: CompanyUser[];
};

export function PipelineFilterBar({ companyUsers }: PipelineFilterBarProps) {
  const [assignee, setAssignee] = useQueryState("assignee");
  const [stage, setStage] = useQueryState("stage");

  const hasFilters = assignee || stage;

  function clearAll() {
    setAssignee(null);
    setStage(null);
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

      {/* Stage filter */}
      <Select
        value={stage ?? "all"}
        onValueChange={(v) => setStage(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All stages" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stages</SelectItem>
          {ALL_DEAL_STAGES.map((s) => (
            <SelectItem key={s} value={s}>
              {DEAL_STAGES[s].label}
            </SelectItem>
          ))}
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