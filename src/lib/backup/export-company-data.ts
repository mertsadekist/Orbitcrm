import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

type Decimal = Prisma.Decimal;

export type CompanyBackupData = {
  version: string;
  exportedAt: string;
  company: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    isActive: boolean;
    maxUsers: number;
    maxQuizzes: number;
    notes: unknown;
    createdAt: Date;
  };
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: string;
    isActive: boolean;
    permissions: unknown;
    lastLoginAt: Date | null;
    createdAt: Date;
    // passwordHash explicitly excluded for security
  }>;
  leads: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    companyName: string | null;
    source: string;
    score: number | null;
    status: string;
    assignedToId: string | null;
    quizResponses: unknown;
    notes: unknown;
    tags: string | null;
    createdAt: Date;
  }>;
  deals: Array<{
    id: string;
    title: string;
    value: Decimal;
    currency: string;
    stage: string;
    probability: number;
    expectedCloseDate: Date | null;
    closedAt: Date | null;
    leadId: string;
    assignedToId: string;
    notes: unknown;
    createdAt: Date;
  }>;
  commissions: Array<{
    id: string;
    dealId: string;
    userId: string;
    amount: Decimal;
    percentage: number;
    status: string;
    paidAt: Date | null;
    createdAt: Date;
  }>;
  quizzes: Array<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    config: unknown;
    isPublished: boolean;
    isActive: boolean;
    primaryColor: string;
    backgroundImage: string | null;
    createdAt: Date;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    entity: string | null;
    entityId: string | null;
    userId: string | null;
    oldValues: unknown;
    newValues: unknown;
    createdAt: Date;
  }>;
  stats: {
    userCount: number;
    activeUserCount: number;
    leadCount: number;
    dealCount: number;
    quizCount: number;
    totalRevenue: number;
  };
};

export async function exportCompanyData(
  companyId: string
): Promise<CompanyBackupData> {
  const [
    company,
    users,
    leads,
    deals,
    commissions,
    quizzes,
    auditLogs,
    activeUserCount,
    totalRevenue,
  ] = await Promise.all([
    // Company info
    prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        isActive: true,
        maxUsers: true,
        maxQuizzes: true,
        notes: true,
        createdAt: true,
      },
    }),

    // Users (without passwordHash)
    prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        permissions: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),

    // Leads
    prisma.lead.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    }),

    // Deals
    prisma.deal.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    }),

    // Commissions
    prisma.commission.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    }),

    // Quizzes
    prisma.quiz.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    }),

    // Audit logs (limited to last 10k)
    prisma.auditLog.findMany({
      where: { companyId },
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        userId: true,
        oldValues: true,
        newValues: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10000,
    }),

    // Active user count
    prisma.user.count({
      where: { companyId, isActive: true },
    }),

    // Total revenue from closed won deals
    prisma.deal.aggregate({
      where: {
        companyId,
        stage: "CLOSED_WON",
      },
      _sum: { value: true },
    }),
  ]);

  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    company,
    users,
    leads,
    deals,
    commissions,
    quizzes,
    auditLogs,
    stats: {
      userCount: users.length,
      activeUserCount,
      leadCount: leads.length,
      dealCount: deals.length,
      quizCount: quizzes.length,
      totalRevenue: totalRevenue._sum.value?.toNumber() ?? 0,
    },
  };
}
