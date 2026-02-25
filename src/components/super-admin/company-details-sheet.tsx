"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Download, AlertTriangle, Loader2 } from "lucide-react";
import type { CompanyListItem } from "@/actions/super-admin/get-companies";
import {
  getCompanyUsers,
  type CompanyUserItem,
} from "@/actions/super-admin/get-company-users";
import { updateCompanyQuotas } from "@/actions/super-admin/update-company-quotas";
import { updateCompanyNotes } from "@/actions/super-admin/update-company-notes";
import { CreateCompanyUserDialog } from "./create-company-user-dialog";

type CompanyDetailsSheetProps = {
  company: CompanyListItem | null;
  onClose: () => void;
};

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// ─── Overview Tab ────────────────────────────────────────

function OverviewTab({ company }: { company: CompanyListItem }) {
  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Name</p>
          <p className="font-medium">{company.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Slug</p>
          <p className="font-medium">{company.slug}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Subscription ID</p>
          <p className="font-mono text-xs">{company.subscriptionId}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Plan</p>
          <p className="font-medium">{company.plan}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <Badge
            variant="secondary"
            className={cn(
              company.isActive
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            {company.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Max Users</p>
          <p className="font-medium">{company.maxUsers}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Max Quizzes</p>
          <p className="font-medium">{company.maxQuizzes}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Created</p>
          <p className="font-medium">{formatDate(company.createdAt)}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Statistics
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold">{company._count.users}</p>
            <p className="text-xs text-muted-foreground">Users</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold">{company._count.leads}</p>
            <p className="text-xs text-muted-foreground">Leads</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold">{company._count.deals}</p>
            <p className="text-xs text-muted-foreground">Deals</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold">
              {currencyFormatter.format(company.revenue)}
            </p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quotas Tab ──────────────────────────────────────────

function QuotasTab({ company }: { company: CompanyListItem }) {
  const [plan, setPlan] = useState(company.plan);
  const [maxUsers, setMaxUsers] = useState(company.maxUsers);
  const [maxQuizzes, setMaxQuizzes] = useState(company.maxQuizzes);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPlan(company.plan);
    setMaxUsers(company.maxUsers);
    setMaxQuizzes(company.maxQuizzes);
  }, [company]);

  async function handleSave() {
    setSaving(true);
    const result = await updateCompanyQuotas(company.id, {
      plan,
      maxUsers,
      maxQuizzes,
    });
    if (result.success) {
      toast.success("Quotas updated successfully");
    } else {
      toast.error(result.error ?? "Failed to update quotas");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Plan</Label>
        <Select value={plan} onValueChange={setPlan}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FREE">Free</SelectItem>
            <SelectItem value="STARTER">Starter</SelectItem>
            <SelectItem value="PROFESSIONAL">Professional</SelectItem>
            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Max Users</Label>
        <Input
          type="number"
          min={1}
          max={1000}
          value={maxUsers}
          onChange={(e) => setMaxUsers(Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          Currently using {company.activeUsers} of {company.maxUsers} users
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Max Quizzes</Label>
        <Input
          type="number"
          min={1}
          max={1000}
          value={maxQuizzes}
          onChange={(e) => setMaxQuizzes(Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          Currently using {company._count.quizzes} of {company.maxQuizzes}{" "}
          quizzes
        </p>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Quotas"}
      </Button>
    </div>
  );
}

// ─── Users Tab ───────────────────────────────────────────

function UsersTab({ company }: { company: CompanyListItem }) {
  const [users, setUsers] = useState<CompanyUserItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshUsers = async () => {
    setLoading(true);
    const result = await getCompanyUsers(company.id);
    if (result.success) {
      setUsers(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {users.length} of {company.maxUsers} users
        </p>
        <CreateCompanyUserDialog
          companyId={company.id}
          companyName={company.name}
          currentUserCount={users.length}
          maxUsers={company.maxUsers}
          onSuccess={refreshUsers}
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[80px]">Role</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead className="w-[100px]">Last Login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        user.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {user.lastLoginAt
                      ? formatRelativeTime(user.lastLoginAt)
                      : "Never"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Notes Tab ───────────────────────────────────────────

function NotesTab({ company }: { company: CompanyListItem }) {
  const [notes, setNotes] = useState(company.notes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotes(company.notes ?? "");
  }, [company]);

  async function handleSave() {
    setSaving(true);
    const result = await updateCompanyNotes(company.id, notes);
    if (result.success) {
      toast.success("Notes saved successfully");
    } else {
      toast.error(result.error ?? "Failed to save notes");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Internal Notes</Label>
        <Textarea
          rows={8}
          placeholder="Add internal notes about this company..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Notes"}
      </Button>
    </div>
  );
}

// ─── Backup Tab ──────────────────────────────────────────

function BackupTab({ company }: { company: CompanyListItem }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      // Trigger download by navigating to API route with companyId
      window.location.href = `/api/backup/export?companyId=${company.id}`;
      toast.success("Backup download started");
    } catch (error) {
      console.error("Backup download failed:", error);
      toast.error("Failed to download backup");
    } finally {
      // Reset downloading state after a delay
      setTimeout(() => setIsDownloading(false), 3000);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div>
        <h3 className="text-sm font-medium">Download Company Backup</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Export all data for {company.name} as a ZIP file
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

      {/* Download button */}
      <Button
        onClick={handleDownload}
        disabled={isDownloading}
        size="lg"
        className="w-full"
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
  );
}

// ─── Main Sheet ──────────────────────────────────────────

export function CompanyDetailsSheet({
  company,
  onClose,
}: CompanyDetailsSheetProps) {
  return (
    <Sheet open={!!company} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{company?.name ?? "Company Details"}</SheetTitle>
          <SheetDescription>
            {company?.slug ?? "View and manage company details"}
          </SheetDescription>
        </SheetHeader>

        {company && (
          <div className="px-4 pb-4">
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="quotas">Quotas</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="backup">Backup</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <OverviewTab company={company} />
              </TabsContent>

              <TabsContent value="quotas">
                <QuotasTab company={company} />
              </TabsContent>

              <TabsContent value="users">
                <UsersTab company={company} />
              </TabsContent>

              <TabsContent value="notes">
                <NotesTab company={company} />
              </TabsContent>

              <TabsContent value="backup">
                <BackupTab company={company} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
