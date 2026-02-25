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

const ACTIONS = [
  "LOGIN",
  "CREATE",
  "CREATE_USER",
  "UPDATE",
  "UPDATE_USER",
  "UPDATE_PERMISSIONS",
  "DELETE",
  "DEACTIVATE_USER",
  "REACTIVATE_USER",
  "RESET_PASSWORD",
  "DEAL_CLOSE",
  "DEAL_STAGE_CHANGE",
];

const ENTITIES = ["User", "Lead", "Deal", "Quiz", "Commission"];

type AuditLogFiltersProps = {
  companyUsers: { id: string; firstName: string; lastName: string }[];
};

export function AuditLogFilters({ companyUsers }: AuditLogFiltersProps) {
  const [userId, setUserId] = useQueryState("userId");
  const [action, setAction] = useQueryState("action");
  const [entity, setEntity] = useQueryState("entity");

  const hasFilters = userId || action || entity;

  function clearAll() {
    setUserId(null);
    setAction(null);
    setEntity(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={userId ?? "all"}
        onValueChange={(v) => setUserId(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All users" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All users</SelectItem>
          {companyUsers.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.firstName} {u.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={action ?? "all"}
        onValueChange={(v) => setAction(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All actions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All actions</SelectItem>
          {ACTIONS.map((a) => (
            <SelectItem key={a} value={a}>
              {a.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={entity ?? "all"}
        onValueChange={(v) => setEntity(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All entities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All entities</SelectItem>
          {ENTITIES.map((e) => (
            <SelectItem key={e} value={e}>
              {e}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1">
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
