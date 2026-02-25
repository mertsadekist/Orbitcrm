"use client";

import { Fragment, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SystemLogEntry } from "@/actions/super-admin/get-system-logs";

type LogsTableProps = {
  logs: SystemLogEntry[];
};

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function LevelBadge({ level }: { level: string }) {
  return (
    <Badge
      variant={level === "ERROR" ? "destructive" : "secondary"}
      className={cn(
        level === "WARN" &&
          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        level === "INFO" &&
          "bg-muted text-muted-foreground"
      )}
    >
      {level}
    </Badge>
  );
}

export function SystemLogsTable({ logs }: LogsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Time</TableHead>
            <TableHead className="w-[80px]">Level</TableHead>
            <TableHead className="w-[120px]">Source</TableHead>
            <TableHead className="w-[140px]">Endpoint</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="w-[100px]">User</TableHead>
            <TableHead className="w-[100px]">Company</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No logs found.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <Fragment key={log.id}>
                <TableRow
                  className={cn(
                    "cursor-pointer transition-colors",
                    log.level === "ERROR" &&
                      "bg-red-50/50 dark:bg-red-950/20",
                    log.level === "WARN" &&
                      "bg-amber-50/50 dark:bg-amber-950/20",
                    expandedId === log.id && "border-b-0"
                  )}
                  onClick={() =>
                    setExpandedId(expandedId === log.id ? null : log.id)
                  }
                >
                  <TableCell
                    className="text-xs text-muted-foreground"
                    title={new Date(log.createdAt).toLocaleString()}
                  >
                    {formatRelativeTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <LevelBadge level={log.level} />
                  </TableCell>
                  <TableCell className="text-xs">{log.source}</TableCell>
                  <TableCell className="font-mono text-xs truncate max-w-[140px]">
                    {log.endpoint ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[300px]">
                    {log.message}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate">
                    {log.userId ? log.userId.slice(0, 8) + "..." : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate">
                    {log.companyId ? log.companyId.slice(0, 8) + "..." : "—"}
                  </TableCell>
                </TableRow>

                {expandedId === log.id && (
                  <TableRow>
                    <TableCell colSpan={7} className="bg-muted/50 p-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Full Message
                          </p>
                          <p className="text-sm">{log.message}</p>
                        </div>

                        {log.stack && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Stack Trace
                            </p>
                            <pre className="overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100 dark:bg-slate-950">
                              {log.stack}
                            </pre>
                          </div>
                        )}

                        {log.metadata != null && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Metadata
                            </p>
                            <pre className="overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100 dark:bg-slate-950">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}

                        <div className="flex gap-6 text-xs text-muted-foreground">
                          <span>
                            <strong>ID:</strong> {log.id}
                          </span>
                          {log.userId && (
                            <span>
                              <strong>User:</strong> {log.userId}
                            </span>
                          )}
                          {log.companyId && (
                            <span>
                              <strong>Company:</strong> {log.companyId}
                            </span>
                          )}
                          <span>
                            <strong>Time:</strong>{" "}
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
