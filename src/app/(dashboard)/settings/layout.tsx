import { redirect } from "next/navigation";
import { getTenant, hasMinimumRole } from "@/lib/auth/get-tenant";
import { SettingsNav } from "@/components/settings/settings-nav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenant();

  if (!hasMinimumRole(tenant.role, "MANAGER")) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <div className="flex flex-col gap-6 lg:flex-row">
        <SettingsNav role={tenant.role} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
