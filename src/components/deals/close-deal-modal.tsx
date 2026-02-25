"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useCloseDealMutation } from "@/hooks/use-commission-mutation";
import { fireDealConfetti } from "@/lib/confetti";
import { DealAmountInput } from "./deal-amount-input";
import { CommissionSplitsEditor } from "./commission-splits-editor";
import type { CommissionSplit, CloseDealFormData } from "@/types/deal";
import type { SerializedLead } from "@/types/lead";

type CompanyUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type CloseDealModalProps = {
  lead: SerializedLead | null;
  open: boolean;
  onClose: () => void;
  companyUsers: CompanyUser[];
  onSuccess?: () => void;
};

export function CloseDealModal({
  lead,
  open,
  onClose,
  companyUsers,
  onSuccess,
}: CloseDealModalProps) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState<number | "">(0);
  const [currency, setCurrency] = useState("USD");
  const [splits, setSplits] = useState<CommissionSplit[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const closeDeal = useCloseDealMutation();

  useEffect(() => {
    if (lead && open) {
      const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
      setTitle(name ? "Deal - " + name : "");
      setValue(0);
      setCurrency("USD");
      setErrors({});

      if (lead.assignedToId) {
        const user = companyUsers.find((u) => u.id === lead.assignedToId);
        if (user) {
          setSplits([
            {
              userId: user.id,
              label: user.firstName + " " + user.lastName,
              percentage: 0,
              amount: 0,
            },
          ]);
        } else {
          setSplits([]);
        }
      } else {
        setSplits([]);
      }
    }
  }, [lead, open, companyUsers]);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required";
    if (!value || value <= 0) errs.value = "Value must be positive";
    const totalPct = splits.reduce((sum, s) => sum + s.percentage, 0);
    if (totalPct > 100) errs.splits = "Total splits cannot exceed 100%";
    if (splits.some((s) => !s.userId)) errs.splits = "All splits must have a user";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [title, value, splits]);

  async function handleSubmit() {
    if (!lead || !validate()) return;

    const data: CloseDealFormData = {
      leadId: lead.id,
      title: title.trim(),
      value: Number(value),
      currency,
      splits: splits.filter((s) => s.percentage > 0),
    };

    const result = await closeDeal.mutateAsync(data);

    if (result.success) {
      fireDealConfetti();
      onClose();
      if (onSuccess) onSuccess();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Close Deal</DialogTitle>
          <DialogDescription>
            Convert this lead to a won deal and distribute commissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="deal-title">Deal Title</Label>
            <Input
              id="deal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter deal title"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <DealAmountInput
            value={value}
            currency={currency}
            onValueChange={setValue}
            onCurrencyChange={setCurrency}
            error={errors.value}
          />

          <CommissionSplitsEditor
            splits={splits}
            dealValue={Number(value) || 0}
            companyUsers={companyUsers}
            onChange={setSplits}
            error={errors.splits}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={closeDeal.isPending}
          >
            {closeDeal.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Close Deal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
