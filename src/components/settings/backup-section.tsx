"use client";

import { useState } from "react";
import { Download, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const BACKUP_KEY = "last-backup-timestamp";
const MIN_BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function BackupSection({ isOwner }: { isOwner: boolean }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(BACKUP_KEY);
  });

  const handleDownload = async () => {
    // Rate limit check
    if (lastBackup) {
      const lastBackupTime = parseInt(lastBackup, 10);
      const timeSinceLastBackup = Date.now() - lastBackupTime;
      if (timeSinceLastBackup < MIN_BACKUP_INTERVAL) {
        const remainingSeconds = Math.ceil(
          (MIN_BACKUP_INTERVAL - timeSinceLastBackup) / 1000
        );
        alert(
          `Please wait ${remainingSeconds} seconds before creating another backup.`
        );
        return;
      }
    }

    setIsDownloading(true);

    try {
      // Trigger download by navigating to API route
      window.location.href = "/api/backup/export";

      // Save timestamp
      const timestamp = Date.now().toString();
      localStorage.setItem(BACKUP_KEY, timestamp);
      setLastBackup(timestamp);
    } catch (error) {
      console.error("Backup download failed:", error);
      alert("Failed to download backup. Please try again.");
    } finally {
      // Reset downloading state after a delay (since we can't detect download completion)
      setTimeout(() => setIsDownloading(false), 3000);
    }
  };

  const getLastBackupText = () => {
    if (!lastBackup) return "Never";

    const timestamp = parseInt(lastBackup, 10);
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Download Backup</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Export all your company data as a ZIP file
          </p>
        </div>

        {/* Warning */}
        <div className="flex gap-3 rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-950/20">
          <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500" />
          <div className="text-sm">
            <p className="font-medium text-yellow-900 dark:text-yellow-200">
              Security Notice
            </p>
            <p className="mt-1 text-yellow-700 dark:text-yellow-300/90">
              Backup contains all company data except user passwords. Store
              securely and do not share publicly.
            </p>
          </div>
        </div>

        {/* Last backup info */}
        {lastBackup && (
          <div className="text-sm text-muted-foreground">
            Last backup: <span className="font-medium">{getLastBackupText()}</span>
          </div>
        )}

        {/* Download button */}
        <div>
          <Button
            onClick={handleDownload}
            disabled={isDownloading || !isOwner}
            size="lg"
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing backup...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Backup
              </>
            )}
          </Button>
          {!isOwner && (
            <p className="mt-2 text-sm text-muted-foreground">
              Only company owners can download backups
            </p>
          )}
        </div>

        {/* What's included */}
        <div className="rounded-md border p-4">
          <p className="text-sm font-medium mb-2">Backup includes:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Company profile and settings</li>
            <li>Users (excluding passwords)</li>
            <li>Leads with notes</li>
            <li>Deals with notes</li>
            <li>Commissions</li>
            <li>Quizzes with questions and submissions</li>
            <li>Audit logs (last 10,000 entries)</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
