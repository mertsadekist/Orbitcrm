"use server";

import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { hasMinimumRole } from "@/lib/auth/get-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import { withErrorHandling, AppError } from "@/lib/logger";
import { deserializeFilters } from "@/lib/analytics/filter-serializer";
import { buildPrismaWhere } from "@/lib/analytics/build-prisma-where";
import { formatLeadsToCSV } from "@/lib/analytics/csv-formatter";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

export async function exportCSV(filtersB64?: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "exportCSV",
    async () => {
      if (
        !hasMinimumRole(tenant.role, "MANAGER") ||
        !hasPermission(tenant.role, tenant.permissions, "canExportData")
      ) {
        throw new AppError(
          "You don't have permission to export data",
          "FORBIDDEN",
          403
        );
      }

      assertNotImpersonating(tenant);

      const filters = deserializeFilters(filtersB64);
      const { leadWhere } = buildPrismaWhere(filters, tenant.companyId);

      const leads = await prisma.lead.findMany({
        where: leadWhere,
        include: {
          assignedTo: {
            select: { firstName: true, lastName: true },
          },
          quiz: {
            select: { title: true },
          },
          deals: {
            select: { value: true },
          },
        },
        take: 10000,
        orderBy: { createdAt: "desc" },
      });

      return formatLeadsToCSV(leads);
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
