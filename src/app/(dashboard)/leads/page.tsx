import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { LeadFilterBar } from "@/components/leads/lead-filter-bar";
import { KanbanBoard } from "@/components/leads/kanban-board";
import { CreateLeadDialog } from "@/components/leads/create-lead-dialog";
import { ImportLeadsDialog } from "@/components/leads/import-leads-dialog";
import type { SerializedLead, CompanyUser, LeadNote } from "@/types/lead";

type LeadsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const tenant = await getTenant();
  const params = await searchParams;

  // Build filter where clause
  const where: Record<string, unknown> = {
    companyId: tenant.companyId,
  };

  // Assignee
  if (params.assignee && typeof params.assignee === "string") {
    where.assignedToId = params.assignee;
  }

  // Source
  if (params.source && typeof params.source === "string") {
    where.source = params.source;
  }

  // Score range
  if (params.scoreMin || params.scoreMax) {
    const score: Record<string, number> = {};
    if (params.scoreMin) score.gte = Number(params.scoreMin);
    if (params.scoreMax) score.lte = Number(params.scoreMax);
    where.score = score;
  }

  // Status
  if (params.status && typeof params.status === "string") {
    where.status = params.status;
  }

  // Campaign
  if (params.campaign && typeof params.campaign === "string") {
    where.campaignName = params.campaign;
  }

  // Full-text search (name / email / phone / company)
  if (params.q && typeof params.q === "string") {
    const q = params.q.trim();
    if (q) {
      where.OR = [
        { firstName:   { contains: q } },
        { lastName:    { contains: q } },
        { email:       { contains: q } },
        { phone:       { contains: q } },
        { companyName: { contains: q } },
      ];
    }
  }

  // Date range presets
  if (params.dateRange && typeof params.dateRange === "string" && params.dateRange !== "all") {
    const now = new Date();
    const start = new Date(now);
    switch (params.dateRange) {
      case "today": start.setHours(0, 0, 0, 0); break;
      case "week":  start.setDate(now.getDate() - 7); break;
      case "month": start.setMonth(now.getMonth() - 1); break;
      case "30d":   start.setDate(now.getDate() - 30); break;
      case "90d":   start.setDate(now.getDate() - 90); break;
    }
    where.createdAt = { gte: start };
  }

  const [leads, users, campaignRows] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        quiz: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findMany({
      where: { companyId: tenant.companyId, isActive: true },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: "asc" },
    }),
    // Distinct campaign names for the campaign filter dropdown
    prisma.lead.findMany({
      where: { companyId: tenant.companyId, campaignName: { not: null } },
      select: { campaignName: true },
      distinct: ["campaignName"],
      orderBy: { campaignName: "asc" },
    }),
  ]);

  const serializedLeads: SerializedLead[] = leads.map((lead) => ({
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
    campaignName: lead.campaignName,
    convertedAt: lead.convertedAt?.toISOString() ?? null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    assignedTo: lead.assignedTo,
    quiz: lead.quiz,
  }));

  const companyUsers: CompanyUser[] = users;
  const campaignNames: string[] = campaignRows
    .map((r) => r.campaignName)
    .filter((c): c is string => !!c);

  return (
    <NuqsAdapter>
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track your leads pipeline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ImportLeadsDialog />
            <CreateLeadDialog companyUsers={companyUsers} />
          </div>
        </div>

        {/* Filters */}
        <Suspense>
          <LeadFilterBar companyUsers={companyUsers} campaigns={campaignNames} />
        </Suspense>

        {/* Kanban */}
        <KanbanBoard
          initialLeads={serializedLeads}
          companyUsers={companyUsers}
          currentUserRole={tenant.role}
          canBulkActions={tenant.permissions.canBulkActions}
        />
      </div>
    </NuqsAdapter>
  );
}
