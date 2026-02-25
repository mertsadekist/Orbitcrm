"use server";

import { prisma } from "@/lib/prisma";
import { getTenant, hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import type { SerializedAuditLog } from "@/types/user-management";

const PAGE_SIZE = 100;

type AuditLogFilters = {
  userId?: string;
  action?: string;
  entity?: string;
};

export async function getAuditLogs(page: number = 1, filters?: AuditLogFilters) {
  const tenant = await getTenant();

  return withErrorHandling(
    "getAuditLogs",
    async () => {
      if (!hasMinimumRole(tenant.role, "OWNER")) {
        throw new AppError("Only owners can view audit logs", "FORBIDDEN", 403);
      }

      const where: Record<string, unknown> = {
        companyId: tenant.companyId,
      };

      if (filters?.userId) {
        where.userId = filters.userId;
      }
      if (filters?.action) {
        where.action = filters.action;
      }
      if (filters?.entity) {
        where.entity = filters.entity;
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: PAGE_SIZE,
          skip: (page - 1) * PAGE_SIZE,
        }),
        prisma.auditLog.count({ where }),
      ]);

      const serialized: SerializedAuditLog[] = logs.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        oldValues: log.oldValues as Record<string, unknown> | null,
        newValues: log.newValues as Record<string, unknown> | null,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt.toISOString(),
        user: log.user
          ? {
              firstName: log.user.firstName,
              lastName: log.user.lastName,
              avatar: log.user.avatar,
            }
          : null,
      }));

      return {
        logs: serialized,
        total,
        page,
        totalPages: Math.ceil(total / PAGE_SIZE),
      };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
