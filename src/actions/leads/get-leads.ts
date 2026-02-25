"use server";

import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling } from "@/lib/logger";
import type { LeadFilters, SerializedLead, FullLead, LeadNote } from "@/types/lead";

export async function getLeads(filters?: LeadFilters) {
  const tenant = await getTenant();

  return withErrorHandling(
    "getLeads",
    async () => {
      const where: Record<string, unknown> = {
        companyId: tenant.companyId,
      };

      if (filters?.assignee) {
        where.assignedToId = filters.assignee;
      }
      if (filters?.source) {
        where.source = filters.source;
      }
      if (filters?.scoreMin != null || filters?.scoreMax != null) {
        where.score = {
          ...(filters.scoreMin != null ? { gte: filters.scoreMin } : {}),
          ...(filters.scoreMax != null ? { lte: filters.scoreMax } : {}),
        };
      }
      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {
          ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
          ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
        };
      }

      const leads = await prisma.lead.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          quiz: { select: { id: true, title: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

      return leads.map((lead) => ({
        id: lead.id,
        companyId: lead.companyId,
        quizId: lead.quizId,
        assignedToId: lead.assignedToId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        companyName: lead.companyName,
        source: lead.source,
        status: lead.status,
        score: lead.score,
        notes: (lead.notes as unknown as LeadNote[]) ?? null,
        tags: lead.tags,
        convertedAt: lead.convertedAt?.toISOString() ?? null,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
        assignedTo: lead.assignedTo,
        quiz: lead.quiz,
      })) satisfies SerializedLead[];
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}

export async function getLeadById(leadId: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "getLeadById",
    async () => {
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, companyId: tenant.companyId },
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          quiz: { select: { id: true, title: true } },
          deals: {
            select: {
              id: true,
              title: true,
              value: true,
              stage: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!lead) return null;

      return {
        id: lead.id,
        companyId: lead.companyId,
        quizId: lead.quizId,
        assignedToId: lead.assignedToId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        companyName: lead.companyName,
        source: lead.source,
        status: lead.status,
        score: lead.score,
        notes: (lead.notes as unknown as LeadNote[]) ?? null,
        tags: lead.tags,
        convertedAt: lead.convertedAt?.toISOString() ?? null,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
        assignedTo: lead.assignedTo,
        quiz: lead.quiz,
        quizResponses: lead.quizResponses,
        deals: lead.deals.map((d) => ({
          id: d.id,
          title: d.title,
          value: d.value.toString(),
          stage: d.stage,
          createdAt: d.createdAt.toISOString(),
        })),
      } satisfies FullLead;
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}

export async function getCompanyUsers() {
  const tenant = await getTenant();

  return withErrorHandling(
    "getCompanyUsers",
    async () => {
      return prisma.user.findMany({
        where: { companyId: tenant.companyId, isActive: true },
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: { firstName: "asc" },
      });
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
