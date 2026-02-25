import { getTenant } from "@/lib/auth/get-tenant";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/../auth";
import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "@/components/providers/query-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ImpersonationBanner } from "@/components/super-admin/impersonation-banner";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenant();

  const [company, leadCount] = await Promise.all([
    prisma.company.findUnique({
      where: { id: tenant.companyId },
      select: { name: true },
    }),
    prisma.lead.count({ where: { companyId: tenant.companyId } }),
  ]);

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <QueryProvider>
      {tenant.isImpersonating && (
        <SessionProvider>
          <ImpersonationBanner companyName={company?.name ?? "Unknown"} />
        </SessionProvider>
      )}
      <DashboardShell
        user={{
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          email: tenant.email,
          role: tenant.role,
          canViewAnalytics: tenant.permissions.canViewAnalytics,
        }}
        companyName={company?.name ?? "OrbitFlow"}
        leadCount={leadCount}
        onSignOut={handleSignOut}
      >
        {children}
      </DashboardShell>
      <Toaster />
    </QueryProvider>
  );
}
