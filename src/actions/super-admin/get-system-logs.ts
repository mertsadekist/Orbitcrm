"use server";

import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";

export type SystemLogEntry = {
  id: string;
  level: string;
  message: string;
  stack: string | null;
  source: string;
  endpoint: string | null;
  userId: string | null;
  companyId: string | null;
  metadata: unknown;
  createdAt: string; // ISO string for serialization
};

export type PaginatedLogs = {
  logs: SystemLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type LogFilters = {
  level?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export async function getSystemLogs(
  filters: LogFilters = {}
): Promise<ReturnType<typeof withErrorHandling<PaginatedLogs>>> {
  const tenant = await getTenant();

  return withErrorHandling(
    "getSystemLogs",
    async () => {
      if (tenant.role !== "SUPER_ADMIN") {
        throw new AppError("Access denied", "FORBIDDEN", 403);
      }

      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 50;
      const skip = (page - 1) * pageSize;

      // Build dynamic where clause
      const where: Record<string, unknown> = {};

      if (filters.level && filters.level !== "ALL") {
        where.level = filters.level;
      }
      if (filters.source && filters.source !== "ALL") {
        where.source = filters.source;
      }
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {
          ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
          ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
        };
      }

      const [logs, total] = await Promise.all([
        prisma.systemLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.systemLog.count({ where }),
      ]);

      return {
        logs: logs.map((log) => ({
          ...log,
          metadata: log.metadata ?? null,
          createdAt: log.createdAt.toISOString(),
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
