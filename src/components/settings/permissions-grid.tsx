"use client";

import { useState, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Download,
  Trash2,
  BarChart3,
  FileQuestion,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { updatePermissions } from "@/actions/users/update-permissions";
import { PERMISSION_DEFINITIONS } from "@/lib/auth/permissions";
import type { UserPermissions } from "@/types/user-management";
import type { Role } from "@/generated/prisma/client";

const ICON_MAP: Record<string, LucideIcon> = {
  Download,
  Trash2,
  BarChart3,
  FileQuestion,
  Zap,
};

type PermissionsGridProps = {
  userId: string;
  role: Role;
  permissions: UserPermissions;
};

export function PermissionsGrid({
  userId,
  role,
  permissions,
}: PermissionsGridProps) {
  const [perms, setPerms] = useState<UserPermissions>(permissions);
  const [saving, setSaving] = useState<string | null>(null);

  const isHighRole = role === "MANAGER" || role === "OWNER" || role === "SUPER_ADMIN";

  const handleToggle = useCallback(
    async (key: keyof UserPermissions) => {
      if (isHighRole) return;

      const updated = { ...perms, [key]: !perms[key] };
      setPerms(updated);
      setSaving(key);

      const result = await updatePermissions(userId, updated);
      setSaving(null);

      if (result.success) {
        toast.success("Permission updated");
      } else {
        // Revert on failure
        setPerms(perms);
        toast.error(result.error);
      }
    },
    [userId, perms, isHighRole]
  );

  if (isHighRole) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Managers and above always have full permissions. Granular permission
          toggles only apply to employees.
        </p>
        <div className="space-y-3">
          {PERMISSION_DEFINITIONS.map((def) => {
            const Icon = ICON_MAP[def.icon] ?? Zap;
            return (
              <div
                key={def.key}
                className="flex items-center justify-between rounded-lg border p-3 opacity-60"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{def.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {def.description}
                    </p>
                  </div>
                </div>
                <Switch checked disabled />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {PERMISSION_DEFINITIONS.map((def) => {
        const Icon = ICON_MAP[def.icon] ?? Zap;
        const isSaving = saving === def.key;

        return (
          <div
            key={def.key}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{def.label}</p>
                <p className="text-xs text-muted-foreground">
                  {def.description}
                </p>
              </div>
            </div>
            <Switch
              checked={perms[def.key]}
              onCheckedChange={() => handleToggle(def.key)}
              disabled={isSaving}
            />
          </div>
        );
      })}
    </div>
  );
}
