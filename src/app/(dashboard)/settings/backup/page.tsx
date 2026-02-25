import { redirect } from "next/navigation";
import { getTenant } from "@/lib/auth/get-tenant";
import { BackupSection } from "@/components/settings/backup-section";

export default async function BackupPage() {
  const tenant = await getTenant();

  // Only OWNER and SUPER_ADMIN can access backup page
  if (tenant.role !== "OWNER" && tenant.role !== "SUPER_ADMIN") {
    redirect("/settings/users");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Data Backup</h1>
        <p className="text-muted-foreground mt-1">
          Download a complete backup of your company data
        </p>
      </div>

      <BackupSection isOwner={true} />
    </div>
  );
}
