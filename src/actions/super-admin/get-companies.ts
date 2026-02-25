"use server";

import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";

// ─── Types ──────────────────────────────────────────────

export type CompanyListItem = {
  id: string;
  subscriptionId: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  maxUsers: number;
  maxQuizzes: number;
  notes: string | null;
  createdAt: string;
  _count: { users: number; leads: number; deals: number; quizzes: number };
  activeUsers: number;
  revenue: number;
};

export type CompanyFilters = {
  search?: string;
  plan?: string;
  isActive?: "true" | "false";
  page?: number;
  pageSize?: number;
};

export type PaginatedCompanies = {
  companies: CompanyListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ─── Action ─────────────────────────────────────────────

export async function getCompanies(
  filters: CompanyFilters = {}
): Promise<ReturnType<typeof withErrorHandling<PaginatedCompanies>>> {
  const tenant = await getTenant();

  return withErrorHandling(
    "getCompanies",
    async () => {
      if (tenant.role !== "SUPER_ADMIN") {
        throw new AppError("Access denied", "FORBIDDEN", 403);
      }

      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 25;
      const skip = (page - 1) * pageSize;

      // Build dynamic where clause
      const where: Record<string, unknown> = {};

      if (filters.search) {
        where.name = { contains: filters.search };
      }
      if (filters.plan) {
        where.plan = filters.plan;
      }
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive === "true";
      }

      const [companies, total] = await Promise.all([
        prisma.company.findMany({
          where,
          include: {
            _count: {
              select: { users: true, leads: true, deals: true, quizzes: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.company.count({ where }),
      ]);

      const companyIds = companies.map((c) => c.id);

      // Batch active users per company
      const activeUsersGroups = await prisma.user.groupBy({
        by: ["companyId"],
        where: { companyId: { in: companyIds }, isActive: true },
        _count: { _all: true },
      });

      const activeUsersMap = new Map(
        activeUsersGroups.map((g) => [g.companyId, g._count._all])
      );

      // Batch revenue (CLOSED_WON deals) per company
      const revenueGroups = await prisma.deal.groupBy({
        by: ["companyId"],
        where: { companyId: { in: companyIds }, stage: "CLOSED_WON" },
        _sum: { value: true },
      });

      const revenueMap = new Map(
        revenueGroups.map((g) => [g.companyId, Number(g._sum.value ?? 0)])
      );

      // Merge into CompanyListItem[]
      const result: CompanyListItem[] = companies.map((c) => ({
        id: c.id,
        subscriptionId: c.subscriptionId,
        name: c.name,
        slug: c.slug,
        plan: c.plan,
        isActive: c.isActive,
        maxUsers: c.maxUsers,
        maxQuizzes: c.maxQuizzes,
        notes: c.notes ?? null,
        createdAt: c.createdAt.toISOString(),
        _count: c._count,
        activeUsers: activeUsersMap.get(c.id) ?? 0,
        revenue: revenueMap.get(c.id) ?? 0,
      }));

      return {
        companies: result,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
