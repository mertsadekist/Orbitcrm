"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant } from "@/lib/auth/get-tenant";
import { hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

export async function approveCommission(commissionId: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "approveCommission",
    async () => {
      if (!hasMinimumRole(tenant.role, "OWNER")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      const commission = await prisma.commission.findFirst({
        where: { id: commissionId, companyId: tenant.companyId },
      });

      if (!commission) {
        throw new AppError("Commission not found", "NOT_FOUND", 404);
      }

      if (commission.status !== "PENDING") {
        throw new AppError(
          "Commission is not in PENDING status",
          "VALIDATION_ERROR",
          400
        );
      }

      await prisma.$transaction([
        prisma.commission.update({
          where: { id: commissionId },
          data: { status: "APPROVED" },
        }),
        prisma.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "COMMISSION_APPROVE",
            entity: "Commission",
            entityId: commissionId,
            oldValues: { status: "PENDING" } as unknown as Prisma.InputJsonValue,
            newValues: { status: "APPROVED" } as unknown as Prisma.InputJsonValue,
          },
        }),
      ]);

      revalidatePath("/pipeline");
      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}

export async function payCommission(commissionId: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "payCommission",
    async () => {
      if (!hasMinimumRole(tenant.role, "OWNER")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      const commission = await prisma.commission.findFirst({
        where: { id: commissionId, companyId: tenant.companyId },
      });

      if (!commission) {
        throw new AppError("Commission not found", "NOT_FOUND", 404);
      }

      if (commission.status !== "APPROVED") {
        throw new AppError(
          "Commission must be APPROVED before payment",
          "VALIDATION_ERROR",
          400
        );
      }

      await prisma.$transaction([
        prisma.commission.update({
          where: { id: commissionId },
          data: { status: "PAID", paidAt: new Date() },
        }),
        prisma.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "COMMISSION_PAY",
            entity: "Commission",
            entityId: commissionId,
            oldValues: { status: "APPROVED" } as unknown as Prisma.InputJsonValue,
            newValues: { status: "PAID" } as unknown as Prisma.InputJsonValue,
          },
        }),
      ]);

      revalidatePath("/pipeline");
      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}

export async function bulkApproveCommissions(commissionIds: string[]) {
  const tenant = await getTenant();

  return withErrorHandling(
    "bulkApproveCommissions",
    async () => {
      if (!hasMinimumRole(tenant.role, "OWNER")) {
        throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
      }

      assertNotImpersonating(tenant);

      if (commissionIds.length === 0) {
        throw new AppError("No commissions selected", "VALIDATION_ERROR", 400);
      }

      const commissions = await prisma.commission.findMany({
        where: {
          id: { in: commissionIds },
          companyId: tenant.companyId,
          status: "PENDING",
        },
      });

      if (commissions.length === 0) {
        throw new AppError(
          "No pending commissions found",
          "VALIDATION_ERROR",
          400
        );
      }

      const validIds = commissions.map((c) => c.id);

      await prisma.$transaction([
        prisma.commission.updateMany({
          where: { id: { in: validIds } },
          data: { status: "APPROVED" },
        }),
        prisma.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "COMMISSION_BULK_APPROVE",
            entity: "Commission",
            newValues: {
              count: validIds.length,
              ids: validIds,
            } as unknown as Prisma.InputJsonValue,
          },
        }),
      ]);

      revalidatePath("/pipeline");
      return { approved: validIds.length };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}