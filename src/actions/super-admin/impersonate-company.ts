"use server";

import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";

export type ImpersonationResult = {
  companyId: string;
  companyName: string;
  isImpersonating: true;
  originalUserId: string;
  originalCompanyId: string;
};

export async function impersonateCompany(targetCompanyId: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "impersonateCompany",
    async () => {
      if (tenant.role !== "SUPER_ADMIN") {
        throw new AppError("Access denied", "FORBIDDEN", 403);
      }

      if (tenant.isImpersonating) {
        throw new AppError("Already impersonating", "CONFLICT", 409);
      }

      const company = await prisma.company.findUnique({
        where: { id: targetCompanyId },
        select: { id: true, name: true, subscriptionId: true },
      });

      if (!company) {
        throw new AppError("Company not found", "NOT_FOUND", 404);
      }

      await prisma.systemLog.create({
        data: {
          level: "INFO",
          message: `Super admin started impersonating company: ${company.name}`,
          source: "IMPERSONATION",
          userId: tenant.userId,
          companyId: company.id,
          metadata: {
            action: "IMPERSONATE_START",
            targetCompanyId,
            targetCompanyName: company.name,
          },
        },
      });

      return {
        companyId: company.id,
        companyName: company.name,
        isImpersonating: true,
        originalUserId: tenant.userId,
        originalCompanyId: tenant.companyId,
      } satisfies ImpersonationResult;
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
