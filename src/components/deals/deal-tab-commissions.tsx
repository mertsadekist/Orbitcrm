"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, DollarSign } from "lucide-react";
import { useApproveCommission, usePayCommission } from "@/hooks/use-commission-mutation";
import { formatCurrency, calculateCompanyShare } from "@/lib/deal-utils";
import type { SerializedDeal, SerializedCommission } from "@/types/deal";
type DealTabCommissionsProps = {
  deal: SerializedDeal;
  isOwner: boolean;
};
function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge variant="outline" className="text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30">Pending</Badge>;
    case "APPROVED":
      return <Badge variant="outline" className="text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30">Approved</Badge>;
    case "PAID":
      return <Badge variant="outline" className="text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30">Paid</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
export function DealTabCommissions({ deal, isOwner }: DealTabCommissionsProps) {
  const approve = useApproveCommission();
  const pay = usePayCommission();
  const commissions = deal.commissions ?? [];
  const dealValue = parseFloat(deal.value);
  const splits = commissions.map((c) => ({
    userId: c.userId,
    label: `${c.user.firstName} ${c.user.lastName}`,
    percentage: c.percentage,
    amount: parseFloat(c.amount),
  }));
  const companyShare = calculateCompanyShare(dealValue, splits);
  return (
    <div className="space-y-4">
      {/* Commission rows */}
      {commissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No commission splits for this deal.</p>
      ) : (
        <div className="space-y-3">
          {commissions.map((comm) => (
            <CommissionRow
              key={comm.id}
              commission={comm}
              isOwner={isOwner}
              onApprove={() => approve.mutate(comm.id)}
              onPay={() => pay.mutate(comm.id)}
              isApproving={approve.isPending}
              isPaying={pay.isPending}
            />
          ))}
        </div>
      )}
      {/* Company share */}
      <div className="flex items-center justify-between rounded-md border border-dashed px-3 py-2">
        <div>
          <span className="text-sm font-medium">Company Share</span>
          <span className="ml-2 text-sm text-muted-foreground">
            ({companyShare.percentage}%)
          </span>
        </div>
        <span className="text-sm font-semibold">
          {formatCurrency(companyShare.amount, deal.currency)}
        </span>
      </div>
    </div>
  );
}
function CommissionRow({
  commission,
  isOwner,
  onApprove,
  onPay,
  isApproving,
  isPaying,
}: {
  commission: SerializedCommission;
  isOwner: boolean;
  onApprove: () => void;
  onPay: () => void;
  isApproving: boolean;
  isPaying: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <div className="flex-1">
        <p className="text-sm font-medium">
          {commission.user.firstName} {commission.user.lastName}
        </p>
        <p className="text-xs text-muted-foreground">
          {commission.percentage}% ΓÇö {formatCurrency(commission.amount)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {getStatusBadge(commission.status)}
        {isOwner && commission.status === "PENDING" && (
          <Button
            size="sm"
            variant="outline"
            onClick={onApprove}
            disabled={isApproving}
            className="gap-1"
          >
            {isApproving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Approve
          </Button>
        )}
        {isOwner && commission.status === "APPROVED" && (
          <Button
            size="sm"
            variant="outline"
            onClick={onPay}
            disabled={isPaying}
            className="gap-1"
          >
            {isPaying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <DollarSign className="h-3.5 w-3.5" />
            )}
            Pay
          </Button>
        )}
      </div>
    </div>
  );
}