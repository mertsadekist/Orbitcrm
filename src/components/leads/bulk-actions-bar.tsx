"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { ALL_STATUSES, LEAD_STATUSES } from "@/lib/constants";
import { useBulkAssign, useBulkUpdateStatus } from "@/hooks/use-lead-mutation";
import type { CompanyUser, LeadStatusValue } from "@/types/lead";

type BulkActionsBarProps = {
  selectedLeads: Set<string>;
  companyUsers: CompanyUser[];
  canBulkActions: boolean;
  onClearSelection: () => void;
};

export function BulkActionsBar({
  selectedLeads,
  companyUsers,
  canBulkActions,
  onClearSelection,
}: BulkActionsBarProps) {
  const bulkAssign = useBulkAssign();
  const bulkUpdateStatus = useBulkUpdateStatus();
  const leadIds = Array.from(selectedLeads);

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background p-3 shadow-sm">
      <span className="text-sm font-medium">
        {selectedLeads.size} lead{selectedLeads.size > 1 ? "s" : ""} selected
      </span>

      {canBulkActions && (
        <>
          <Select
            onValueChange={(userId) => {
              bulkAssign.mutate({
                leadIds,
                assignedToId: userId === "unassign" ? null : userId,
              });
              onClearSelection();
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Assign to..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassign">Unassign</SelectItem>
              {companyUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(status) => {
              bulkUpdateStatus.mutate({
                leadIds,
                status: status as LeadStatusValue,
              });
              onClearSelection();
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Change status..." />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {LEAD_STATUSES[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      <Button variant="ghost" size="sm" onClick={onClearSelection} className="ml-auto gap-1">
        <X className="h-3.5 w-3.5" />
        Clear
      </Button>
    </div>
  );
}
