"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stopImpersonation } from "@/actions/super-admin/stop-impersonation";
import { toast } from "sonner";

type ImpersonationBannerProps = {
  companyName: string;
};

export function ImpersonationBanner({ companyName }: ImpersonationBannerProps) {
  const { update } = useSession();
  const router = useRouter();
  const [stopping, setStopping] = useState(false);

  async function handleStop() {
    setStopping(true);
    try {
      const result = await stopImpersonation();
      if (!result.success) {
        toast.error(result.error ?? "Failed to stop impersonation");
        setStopping(false);
        return;
      }

      await update({
        companyId: result.data.companyId,
        isImpersonating: false,
        originalUserId: undefined,
        originalCompanyId: undefined,
      });

      router.push("/super-admin/companies");
      router.refresh();
    } catch {
      toast.error("Failed to stop impersonation");
      setStopping(false);
    }
  }

  return (
    <div className="sticky top-0 z-[60] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <span>
        Viewing as <strong>{companyName}</strong> (read-only)
      </span>
      <Button
        variant="outline"
        size="sm"
        className="ml-2 h-7 border-amber-700 bg-amber-600 px-3 text-xs text-amber-950 hover:bg-amber-700"
        onClick={handleStop}
        disabled={stopping}
      >
        {stopping ? "Stopping…" : "Stop Impersonation"}
        <X className="ml-1 h-3 w-3" />
      </Button>
    </div>
  );
}
