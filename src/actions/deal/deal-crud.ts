"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant } from "@/lib/auth/get-tenant";
import { hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import type { SerializedDeal, DealFilters } from "@/types/deal";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

function serializeDeal(deal: {
  id: string;
  companyId: string;
  leadId: string;
  assignedToId: string;
  title: string;
  value: Prisma.Decimal | { toString(): string };
  currency: string;
  stage: string;
  probability: number;
  expectedCloseDate: Date | null;
  closedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  lead: { firstName: string | null; lastName: string | null; companyName: string | null };
  assignedTo: { id: string; firstName: string; lastName: string };
  commissions?: {
    id: string;
    dealId: string;
    userId: string;
    amount: Prisma.Decimal | { toString(): string };
    percentage: number;
    status: string;
    paidAt: Date | null;
    createdAt: Date;
    user: { id: string; firstName: string; lastName: string };
  }[];
}): SerializedDeal {
  return {
    id: deal.id,
    companyId: deal.companyId,
    leadId: deal.leadId,
    assignedToId: deal.assignedToId,
    title: deal.title,
    value: deal.value.toString(),
    currency: deal.currency,
    stage: deal.stage as SerializedDeal["stage"],
    probability: deal.probability,
    expectedCloseDate: deal.expectedCloseDate?.toISOString() ?? null,
    closedAt: deal.closedAt?.toISOString() ?? null,
    notes: deal.notes,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
    lead: deal.lead,
    assignedTo: deal.assignedTo,
    commissions: deal.commissions?.map((c) => ({
      id: c.id,
      dealId: c.dealId,
      userId: c.userId,
      amount: c.amount.toString(),
      percentage: c.percentage,
      status: c.status as "PENDING" | "APPROVED" | "PAID",
      paidAt: c.paidAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
    })),
  };
}

const dealInclude = {
  lead: { select: { firstName: true, lastName: true, companyName: true } },
  assignedTo: { select: { id: true, firstName: true, lastName: true } },
};

const dealWithCommissionsInclude = {
  ...dealInclude,
  commissions: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { percentage: "desc" as const },
  },
};

export async function getDeals(filters?: DealFilters) {
  const tenant = await getTenant();

  return withErrorHandling(
    "getDeals",
    async () => {
      const where: Record<string, unknown> = {
        companyId: tenant.companyId,
      };

      if (filters?.stage) {
        where.stage = filters.stage;
      }
      if (filters?.assigneeId) {
        where.assignedToId = filters.assigneeId;
      }
      if (filters?.dateFrom || filters?.dateTo) {
        const createdAt: Record<string, Date> = {};
        if (filters.dateFrom) createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) createdAt.lte = new Date(filters.dateTo);
        where.createdAt = createdAt;
      }

      const deals = await prisma.deal.findMany({
        where,
        include: dealInclude,
        orderBy: { updatedAt: "desc" },
      });

      return deals.map(serializeDeal);
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}

export async function getDealById(dealId: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "getDealById",
    async () => {
      const deal = await prisma.deal.findFirst({
        where: { id: dealId, companyId: tenant.companyId },
        include: dealWithCommissionsInclude,
      });

      if (!deal) {
        throw new AppError("Deal not found", "NOT_FOUND", 404);
      }

      return serializeDeal(deal);
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}

export async function createDeal(input: {
  leadId: string;
  title: string;
  value: number;
  currency?: string;
  stage?: string;
  assignedToId?: string;
  probability?: number;
  expectedCloseDate?: string;
  notes?: string;
}) {
  const tenant = await getTenant();

  return withErrorHandling(
    "createDeal",
    async () => {
      if (!hasMinimumRole(tenant.role, "MANAGER")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      const lead = await prisma.lead.findFirst({
        where: { id: input.leadId, companyId: tenant.companyId },
      });

      if (!lead) {
        throw new AppError("Lead not found", "NOT_FOUND", 404);
      }

      const assignedToId = input.assignedToId ?? lead.assignedToId ?? tenant.userId;

      const deal = await prisma.$transaction(async (tx) => {
        const newDeal = await tx.deal.create({
          data: {
            companyId: tenant.companyId,
            leadId: input.leadId,
            assignedToId,
            title: input.title,
            value: new Prisma.Decimal(input.value),
            currency: input.currency ?? "USD",
            stage: (input.stage as "PROSPECTING") ?? "PROSPECTING",
            probability: input.probability ?? 10,
            expectedCloseDate: input.expectedCloseDate
              ? new Date(input.expectedCloseDate)
              : null,
            notes: input.notes ?? null,
          },
        });

        await tx.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "DEAL_CREATE",
            entity: "Deal",
            entityId: newDeal.id,
            newValues: {
              title: input.title,
              value: input.value,
              stage: input.stage ?? "PROSPECTING",
            } as unknown as Prisma.InputJsonValue,
          },
        });

        return newDeal;
      });

      revalidatePath("/pipeline");
      return { id: deal.id };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}

export async function updateDeal(
  dealId: string,
  input: {
    title?: string;
    value?: number;
    currency?: string;
    probability?: number;
    expectedCloseDate?: string | null;
    notes?: string | null;
  }
) {
  const tenant = await getTenant();

  return withErrorHandling(
    "updateDeal",
    async () => {
      if (!hasMinimumRole(tenant.role, "MANAGER")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      const deal = await prisma.deal.findFirst({
        where: { id: dealId, companyId: tenant.companyId },
      });

      if (!deal) {
        throw new AppError("Deal not found", "NOT_FOUND", 404);
      }

      const updateData: Record<string, unknown> = {};
      const oldValues: Record<string, unknown> = {};

      if (input.title !== undefined) {
        oldValues.title = deal.title;
        updateData.title = input.title;
      }
      if (input.value !== undefined) {
        oldValues.value = deal.value.toString();
        updateData.value = new Prisma.Decimal(input.value);
      }
      if (input.currency !== undefined) {
        oldValues.currency = deal.currency;
        updateData.currency = input.currency;
      }
      if (input.probability !== undefined) {
        oldValues.probability = deal.probability;
        updateData.probability = input.probability;
      }
      if (input.expectedCloseDate !== undefined) {
        oldValues.expectedCloseDate = deal.expectedCloseDate?.toISOString() ?? null;
        updateData.expectedCloseDate = input.expectedCloseDate
          ? new Date(input.expectedCloseDate)
          : null;
      }
      if (input.notes !== undefined) {
        oldValues.notes = deal.notes;
        updateData.notes = input.notes;
      }

      await prisma.$transaction([
        prisma.deal.update({
          where: { id: dealId },
          data: updateData,
        }),
        prisma.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "DEAL_UPDATE",
            entity: "Deal",
            entityId: dealId,
            oldValues: oldValues as unknown as Prisma.InputJsonValue,
            newValues: updateData as unknown as Prisma.InputJsonValue,
          },
        }),
      ]);

      revalidatePath("/pipeline");
      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}

export async function deleteDeal(dealId: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "deleteDeal",
    async () => {
      if (!hasMinimumRole(tenant.role, "OWNER")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      const deal = await prisma.deal.findFirst({
        where: { id: dealId, companyId: tenant.companyId },
      });

      if (!deal) {
        throw new AppError("Deal not found", "NOT_FOUND", 404);
      }

      await prisma.$transaction([
        prisma.deal.delete({ where: { id: dealId } }),
        prisma.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "DEAL_DELETE",
            entity: "Deal",
            entityId: dealId,
            oldValues: {
              title: deal.title,
              value: deal.value.toString(),
            } as unknown as Prisma.InputJsonValue,
          },
        }),
      ]);

      revalidatePath("/pipeline");
      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
