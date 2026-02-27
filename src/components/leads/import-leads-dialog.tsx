"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { parseLeadFile, downloadLeadTemplate } from "@/lib/leads/excel-parser";
import type { ParsedLeadRow } from "@/lib/leads/excel-parser";
import { useImportLeads } from "@/hooks/use-lead-mutation";

type Stage = "upload" | "preview" | "done";

type DoneResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

const ACCEPTED = ".xlsx,.xls,.csv";

export function ImportLeadsDialog() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [validRows, setValidRows] = useState<ParsedLeadRow[]>([]);
  const [doneResult, setDoneResult] = useState<DoneResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportLeads();

  // ─── Reset state when dialog closes ────────────────────
  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) {
      setTimeout(() => {
        setStage("upload");
        setFileName("");
        setParseErrors([]);
        setValidRows([]);
        setDoneResult(null);
        setIsDragging(false);
      }, 200);
    }
  }

  // ─── File processing ────────────────────────────────────
  const processFile = useCallback((file: File) => {
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const result = parseLeadFile(buffer);
      setValidRows(result.valid);
      setParseErrors(result.errors);
      setStage("preview");
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // ─── Drag & drop handlers ───────────────────────────────
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }
  function handleDragLeave() {
    setIsDragging(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }
  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  // ─── Import action ──────────────────────────────────────
  async function handleImport() {
    const result = await importMutation.mutateAsync(validRows);
    if (result.success) {
      setDoneResult(result.data);
      setStage("done");
    }
  }

  // ─── Renders ────────────────────────────────────────────
  function renderUploadStage() {
    return (
      <div className="space-y-4">
        {/* Drag & Drop Zone */}
        <div
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="rounded-full bg-muted p-3">
            <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium text-sm">
              Drop your file here, or{" "}
              <span className="text-primary underline-offset-4 hover:underline">browse</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Supports .xlsx, .xls, .csv — max 500 rows
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={handleFileInput}
          />
        </div>

        {/* Template download */}
        <div className="flex items-center justify-between rounded-md bg-muted/40 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Need a template?</p>
            <p className="text-xs text-muted-foreground">
              Download our pre-formatted Excel file with the correct columns.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              downloadLeadTemplate();
            }}
          >
            <Download className="h-4 w-4" />
            Template
          </Button>
        </div>
      </div>
    );
  }

  function renderPreviewStage() {
    const previewRows = validRows.slice(0, 10);
    const hasMore = validRows.length > 10;

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex items-center gap-2 rounded-md bg-muted/40 px-4 py-3">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground truncate">{fileName}</span>
          <span className="ml-auto shrink-0 text-sm font-medium">
            {validRows.length} lead{validRows.length !== 1 ? "s" : ""} ready
          </span>
        </div>

        {/* Parse errors */}
        {parseErrors.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-1">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">
                {parseErrors.length} warning{parseErrors.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ul className="ml-6 space-y-0.5">
              {parseErrors.slice(0, 5).map((err, i) => (
                <li key={i} className="text-xs text-destructive/80">
                  {err}
                </li>
              ))}
              {parseErrors.length > 5 && (
                <li className="text-xs text-muted-foreground">
                  …and {parseErrors.length - 5} more
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Preview table */}
        {previewRows.length > 0 ? (
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  {["First Name", "Last Name", "Email", "Status", "Source", "Assigned To", "Campaign"].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 font-medium">{row.firstName}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.lastName ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.email ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.status ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.source ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.assignedTo ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.campaignName ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && (
              <p className="px-3 py-2 text-xs text-muted-foreground border-t">
                …and {validRows.length - 10} more rows not shown
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-center">
            <p className="text-sm text-destructive">
              No valid leads found. Please check the errors above and try again.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setStage("upload")}>
            Back
          </Button>
          <Button
            onClick={handleImport}
            disabled={validRows.length === 0 || importMutation.isPending}
          >
            {importMutation.isPending
              ? "Importing…"
              : `Import ${validRows.length} lead${validRows.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    );
  }

  function renderDoneStage() {
    const r = doneResult!;
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-lg font-semibold">Import complete</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your leads have been added to the pipeline.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-muted/30 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{r.imported}</p>
            <p className="text-xs text-muted-foreground mt-1">Imported</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{r.skipped}</p>
            <p className="text-xs text-muted-foreground mt-1">Skipped (duplicates)</p>
          </div>
        </div>

        {/* Errors from server */}
        {r.errors.length > 0 && (
          <div className="rounded-md border border-muted bg-muted/20 p-3 space-y-1 max-h-32 overflow-auto">
            <p className="text-xs font-medium text-muted-foreground">Notes:</p>
            {r.errors.map((err, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                • {err}
              </p>
            ))}
          </div>
        )}

        <Button className="w-full" onClick={() => handleOpenChange(false)}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {stage === "upload" && "Import Leads from Excel"}
            {stage === "preview" && "Preview Import"}
            {stage === "done" && "Import Complete"}
          </DialogTitle>
          <DialogDescription>
            {stage === "upload" &&
              "Upload an Excel (.xlsx) or CSV file to bulk-import leads into your pipeline."}
            {stage === "preview" &&
              "Review the data below before importing. Existing leads with the same email will be skipped."}
            {stage === "done" && "Here's a summary of your import."}
          </DialogDescription>
        </DialogHeader>

        {stage === "upload" && renderUploadStage()}
        {stage === "preview" && renderPreviewStage()}
        {stage === "done" && renderDoneStage()}
      </DialogContent>
    </Dialog>
  );
}
