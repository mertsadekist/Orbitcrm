"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/lead-utils";
import { AuditLogDetailModal } from "@/components/settings/audit-log-detail-modal";
import type { SerializedAuditLog } from "@/types/user-management";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CREATE_USER: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  UPDATE_USER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  UPDATE_PERMISSIONS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  LOGIN: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  DEACTIVATE_USER: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  REACTIVATE_USER: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  RESET_PASSWORD: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  DEAL_CLOSE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

function getActionLabel(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type AuditLogTableProps = {
  logs: SerializedAuditLog[];
  page: number;
  totalPages: number;
  total: number;
};

export function AuditLogTable({
  logs,
  page,
  totalPages,
  total,
}: AuditLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<SerializedAuditLog | null>(null);

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const initials = log.user
                ? ((log.user.firstName[0] ?? "") + (log.user.lastName[0] ?? "")).toUpperCase()
                : "?";

              return (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {log.user
                          ? log.user.firstName + " " + log.user.lastName
                          : "System"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={ACTION_COLORS[log.action] ?? ""}
                    >
                      {getActionLabel(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.entity ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {log.newValues
                      ? Object.entries(log.newValues)
                          .slice(0, 2)
                          .map(([k, v]) => k + ": " + String(v))
                          .join(", ")
                      : "-"}
                  </TableCell>
                </TableRow>
              );
            })}
            {logs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No audit logs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} total entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              asChild={page > 1}
            >
              {page > 1 ? (
                <a href={"?page=" + (page - 1)}>
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                  Previous
                </a>
              ) : (
                <span>
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                  Previous
                </span>
              )}
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              asChild={page < totalPages}
            >
              {page < totalPages ? (
                <a href={"?page=" + (page + 1)}>
                  Next
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </a>
              ) : (
                <span>
                  Next
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      <AuditLogDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </>
  );
}
