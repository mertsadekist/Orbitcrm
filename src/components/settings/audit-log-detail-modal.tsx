"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { SerializedAuditLog } from "@/types/user-management";

type AuditLogDetailModalProps = {
  log: SerializedAuditLog | null;
  onClose: () => void;
};

function JsonDiff({
  label,
  data,
}: {
  label: string;
  data: Record<string, unknown> | null;
}) {
  if (!data || Object.keys(data).length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="rounded-lg bg-muted p-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm py-0.5">
            <span className="text-muted-foreground">{key}</span>
            <span className="font-mono text-xs">{JSON.stringify(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuditLogDetailModal({
  log,
  onClose,
}: AuditLogDetailModalProps) {
  if (!log) return null;

  const timestamp = new Date(log.createdAt).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "medium",
  });

  return (
    <Dialog open={!!log} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Audit Log Detail</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Timestamp</p>
              <p className="font-medium">{timestamp}</p>
            </div>
            <div>
              <p className="text-muted-foreground">User</p>
              <p className="font-medium">
                {log.user
                  ? log.user.firstName + " " + log.user.lastName
                  : "System"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Action</p>
              <Badge variant="secondary">{log.action}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Entity</p>
              <p className="font-medium">{log.entity ?? "-"}</p>
            </div>
            {log.entityId && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Entity ID</p>
                <p className="font-mono text-xs">{log.entityId}</p>
              </div>
            )}
          </div>

          <Separator />

          <JsonDiff label="Old Values" data={log.oldValues} />
          <JsonDiff label="New Values" data={log.newValues} />

          {(log.ipAddress || log.userAgent) && (
            <>
              <Separator />
              <div className="space-y-2 text-sm">
                {log.ipAddress && (
                  <div>
                    <p className="text-muted-foreground">IP Address</p>
                    <p className="font-mono text-xs">{log.ipAddress}</p>
                  </div>
                )}
                {log.userAgent && (
                  <div>
                    <p className="text-muted-foreground">User Agent</p>
                    <p className="font-mono text-xs truncate">{log.userAgent}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
