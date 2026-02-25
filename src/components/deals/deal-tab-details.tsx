"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateDeal } from "@/actions/deal/deal-crud";
import { formatCurrency } from "@/lib/deal-utils";
import { DEAL_STAGES } from "@/lib/constants";
import type { SerializedDeal } from "@/types/deal";
type DealTabDetailsProps = {
  deal: SerializedDeal;
  canEdit: boolean;
};
export function DealTabDetails({ deal, canEdit }: DealTabDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(deal.title);
  const [probability, setProbability] = useState(deal.probability);
  const [notes, setNotes] = useState(deal.notes ?? "");
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      updateDeal(deal.id, {
        title,
        probability,
        notes: notes || null,
      }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Deal updated");
        qc.invalidateQueries({ queryKey: ["deal", deal.id] });
        qc.invalidateQueries({ queryKey: ["deals"] });
        setIsEditing(false);
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Failed to update deal"),
  });
  const stageConfig = DEAL_STAGES[deal.stage];
  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Title</Label>
            <p className="mt-1 text-sm font-medium">{deal.title}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Value</Label>
            <p className="mt-1 text-sm font-medium">
              {formatCurrency(deal.value, deal.currency)}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Stage</Label>
            <p className={`mt-1 text-sm font-medium ${stageConfig.textClass}`}>
              {stageConfig.label}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Probability</Label>
            <p className="mt-1 text-sm font-medium">{deal.probability}%</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Assigned To</Label>
            <p className="mt-1 text-sm font-medium">
              {deal.assignedTo.firstName} {deal.assignedTo.lastName}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Lead</Label>
            <p className="mt-1 text-sm font-medium">
              {[deal.lead.firstName, deal.lead.lastName].filter(Boolean).join(" ") || "ΓÇö"}
            </p>
          </div>
          {deal.closedAt && (
            <div>
              <Label className="text-muted-foreground">Closed At</Label>
              <p className="mt-1 text-sm font-medium">
                {new Date(deal.closedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
        {deal.notes && (
          <div>
            <Label className="text-muted-foreground">Notes</Label>
            <p className="mt-1 whitespace-pre-wrap text-sm">{deal.notes}</p>
          </div>
        )}
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-probability">Probability (%)</Label>
        <Input
          id="edit-probability"
          type="number"
          min={0}
          max={100}
          value={probability}
          onChange={(e) => setProbability(Number(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-notes">Notes</Label>
        <Textarea
          id="edit-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setTitle(deal.title);
            setProbability(deal.probability);
            setNotes(deal.notes ?? "");
            setIsEditing(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}