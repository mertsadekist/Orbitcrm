"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { CommissionSplitRow } from "./commission-split-row";
import { CompanyShareDisplay } from "./company-share-display";
import type { CommissionSplit } from "@/types/deal";

type CompanyUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type CommissionSplitsEditorProps = {
  splits: CommissionSplit[];
  dealValue: number;
  companyUsers: CompanyUser[];
  onChange: (splits: CommissionSplit[]) => void;
  error?: string;
};

export function CommissionSplitsEditor({
  splits,
  dealValue,
  companyUsers,
  onChange,
  error,
}: CommissionSplitsEditorProps) {
  const totalPct = splits.reduce((sum, s) => sum + s.percentage, 0);
  const usedUserIds = splits.map((s) => s.userId);
  const canAdd = companyUsers.length > splits.length;
  const isOverLimit = totalPct > 100;

  function addSplit() {
    const nextUser = companyUsers.find((u) => !usedUserIds.includes(u.id));
    if (!nextUser) return;

    onChange([
      ...splits,
      {
        userId: nextUser.id,
        label: `${nextUser.firstName} ${nextUser.lastName}`,
        percentage: 0,
        amount: 0,
      },
    ]);
  }

  function updateSplit(index: number, updated: CommissionSplit) {
    const next = [...splits];
    next[index] = updated;
    onChange(next);
  }

  function removeSplit(index: number) {
    onChange(splits.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Commission Splits</Label>
        {canAdd && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSplit}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Split
          </Button>
        )}
      </div>

      {splits.length > 0 && (
        <div className="space-y-2">
          {splits.map((split, i) => (
            <CommissionSplitRow
              key={split.userId || i}
              split={split}
              dealValue={dealValue}
              companyUsers={companyUsers}
              usedUserIds={usedUserIds}
              onUpdate={(updated) => updateSplit(i, updated)}
              onRemove={() => removeSplit(i)}
            />
          ))}
        </div>
      )}

      <CompanyShareDisplay
        totalValue={dealValue}
        totalSplitPercentage={totalPct}
      />

      {isOverLimit && (
        <p className="text-sm text-destructive">
          Total splits exceed 100% ({Math.round(totalPct * 100) / 100}%)
        </p>
      )}

      {error && !isOverLimit && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
