import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { PipelineFilterBar } from "@/components/pipeline/pipeline-filter-bar";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import type { SerializedDeal } from "@/types/deal";
type PipelinePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export default async function PipelinePage({ searchParams }: PipelinePageProps) {
  const tenant = await getTenant();
  const params = await searchParams;
  const where: Record<string, unknown> = {
    companyId: tenant.companyId,
  };
  if (params.assignee && typeof params.assignee === "string") {
    where.assignedToId = params.assignee;
  }
  if (params.stage && typeof params.stage === "string") {
    where.stage = params.stage;
  }
  const [deals, users] = await Promise.all([
    prisma.deal.findMany({
      where,
      include: {
        lead: {
          select: { firstName: true, lastName: true, companyName: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findMany({
      where: { companyId: tenant.companyId, isActive: true },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: "asc" },
    }),
  ]);
  const serializedDeals: SerializedDeal[] = deals.map((deal) => ({
    id: deal.id,
    companyId: deal.companyId,
    leadId: deal.leadId,
    assignedToId: deal.assignedToId,
    title: deal.title,
    value: deal.value.toString(),
    currency: deal.currency,
    stage: deal.stage,
    probability: deal.probability,
    expectedCloseDate: deal.expectedCloseDate?.toISOString() ?? null,
    closedAt: deal.closedAt?.toISOString() ?? null,
    notes: deal.notes,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
    lead: deal.lead,
    assignedTo: deal.assignedTo,
  }));
  return (
    <NuqsAdapter>
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
            <p className="text-sm text-muted-foreground">
              Track and manage your deals pipeline.
            </p>
          </div>
        </div>
        {/* Filters */}
        <Suspense>
          <PipelineFilterBar companyUsers={users} />
        </Suspense>
        {/* Board */}
        <PipelineBoard
          initialDeals={serializedDeals}
          companyUsers={users}
          currentUserRole={tenant.role}
        />
      </div>
    </NuqsAdapter>
  );
}