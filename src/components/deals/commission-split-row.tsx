"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/deal-utils";
import type { CommissionSplit } from "@/types/deal";

type CompanyUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type CommissionSplitRowProps = {
  split: CommissionSplit;
  dealValue: number;
  companyUsers: CompanyUser[];
  usedUserIds: string[];
  onUpdate: (updated: CommissionSplit) => void;
  onRemove: () => void;
};

export function CommissionSplitRow({
  split,
  dealValue,
  companyUsers,
  usedUserIds,
  onUpdate,
  onRemove,
}: CommissionSplitRowProps) {
  const calculatedAmount = Math.round((dealValue * split.percentage) / 100 * 100) / 100;

  const availableUsers = companyUsers.filter(
    (u) => u.id === split.userId || !usedUserIds.includes(u.id)
  );

  return (
    <div className="flex items-center gap-2">
      <Select
        value={split.userId || "placeholder"}
        onValueChange={(userId) => {
          const user = companyUsers.find((u) => u.id === userId);
          if (user) {
            onUpdate({
              ...split,
              userId,
              label: `${user.firstName} ${user.lastName}`,
            });
          }
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select user" />
        </SelectTrigger>
        <SelectContent>
          {availableUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0.01}
          max={100}
          step={0.01}
          value={split.percentage || ""}
          onChange={(e) => {
            const pct = parseFloat(e.target.value);
            if (!isNaN(pct)) {
              onUpdate({ ...split, percentage: pct, amount: Math.round((dealValue * pct) / 100 * 100) / 100 });
            }
          }}
          className="w-[80px]"
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>

      <span className="min-w-[90px] text-sm font-medium text-right">
        {formatCurrency(calculatedAmount)}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}