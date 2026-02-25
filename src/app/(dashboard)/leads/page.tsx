import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { LeadFilterBar } from "@/components/leads/lead-filter-bar";
import { KanbanBoard } from "@/components/leads/kanban-board";
import { CreateLeadDialog } from "@/components/leads/create-lead-dialog";
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

  if (params.assignee && typeof params.assignee === "string") {
    where.assignedToId = params.assignee;
  }
  if (params.source && typeof params.source === "string") {
    where.source = params.source;
  }
  if (params.scoreMin || params.scoreMax) {
    const score: Record<string, number> = {};
    if (params.scoreMin) score.gte = Number(params.scoreMin);
    if (params.scoreMax) score.lte = Number(params.scoreMax);
    where.score = score;
  }

  const [leads, users] = await Promise.all([
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
    convertedAt: lead.convertedAt?.toISOString() ?? null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    assignedTo: lead.assignedTo,
    quiz: lead.quiz,
  }));

  const companyUsers: CompanyUser[] = users;

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
          <CreateLeadDialog companyUsers={companyUsers} />
        </div>

        {/* Filters */}
        <Suspense>
          <LeadFilterBar companyUsers={companyUsers} />
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
