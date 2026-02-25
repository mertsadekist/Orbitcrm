"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportCSV } from "@/actions/analytics/export-csv";
type ExportButtonProps = {
  filtersB64?: string;
  canExportData: boolean;
};

export function ExportButton({ filtersB64, canExportData }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  if (!canExportData) {
    return null;
  }

  async function handleExport() {
    setLoading(true);
    try {
      const result = await exportCSV(filtersB64);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const blob = new Blob([result.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = "orbitflow-leads-" + date + ".csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("CSV exported successfully");
    } catch {
      toast.error("Failed to export CSV");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
    >
      <Download className="mr-1.5 h-3.5 w-3.5" />
      {loading ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
