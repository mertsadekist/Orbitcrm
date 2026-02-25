"use server";

import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";

export type StopImpersonationResult = {
  companyId: string;
  isImpersonating: false;
};

export async function stopImpersonation() {
  const tenant = await getTenant();

  return withErrorHandling(
    "stopImpersonation",
    async () => {
      if (tenant.role !== "SUPER_ADMIN") {
        throw new AppError("Access denied", "FORBIDDEN", 403);
      }

      if (!tenant.isImpersonating) {
        throw new AppError("Not currently impersonating", "CONFLICT", 409);
      }

      await prisma.systemLog.create({
        data: {
          level: "INFO",
          message: "Super admin stopped impersonation",
          source: "IMPERSONATION",
          userId: tenant.originalUserId ?? tenant.userId,
          companyId: tenant.companyId,
          metadata: {
            action: "IMPERSONATE_STOP",
            impersonatedCompanyId: tenant.companyId,
          },
        },
      });

      return {
        companyId: tenant.originalCompanyId!,
        isImpersonating: false,
      } satisfies StopImpersonationResult;
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
