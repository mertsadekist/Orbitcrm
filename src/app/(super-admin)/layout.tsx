import { getTenant } from "@/lib/auth/get-tenant";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { AdminShell } from "@/components/super-admin/admin-shell";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenant();

  if (tenant.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <SessionProvider>
      <AdminShell userName={`${tenant.firstName} ${tenant.lastName}`}>
        {children}
      </AdminShell>
    </SessionProvider>
  );
}
