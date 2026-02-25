import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenant, hasMinimumRole } from "@/lib/auth/get-tenant";
import { getAuditLogs } from "@/actions/users/get-audit-logs";
import { AuditLogTable } from "@/components/settings/audit-log-table";
import { AuditLogFilters } from "@/components/settings/audit-log-filters";
import { NuqsAdapter } from "nuqs/adapters/next/app";

type AuditLogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuditLogPage({
  searchParams,
}: AuditLogPageProps) {
  const tenant = await getTenant();

  if (!hasMinimumRole(tenant.role, "OWNER")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(String(params.page ?? "1"), 10) || 1);
  const filters = {
    userId: typeof params.userId === "string" ? params.userId : undefined,
    action: typeof params.action === "string" ? params.action : undefined,
    entity: typeof params.entity === "string" ? params.entity : undefined,
  };

  const [logsResult, companyUsers] = await Promise.all([
    getAuditLogs(page, filters),
    prisma.user.findMany({
      where: { companyId: tenant.companyId },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  const data = logsResult.success
    ? logsResult.data
    : { logs: [], total: 0, page: 1, totalPages: 1 };

  return (
    <NuqsAdapter>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Audit Log</h2>
          <p className="text-sm text-muted-foreground">
            Track all changes made within your company
          </p>
        </div>

        <AuditLogFilters companyUsers={companyUsers} />

        <AuditLogTable
          logs={data.logs}
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
        />
      </div>
    </NuqsAdapter>
  );
}
