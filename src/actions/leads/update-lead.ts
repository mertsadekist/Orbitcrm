"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

const updateLeadSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  companyName: z.string().max(200).optional(),
  source: z.string().max(50).optional(),
  tags: z.string().max(500).optional(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export async function updateLead(leadId: string, input: UpdateLeadInput) {
  const tenant = await getTenant();

  return withErrorHandling(
    "updateLead",
    async () => {
      assertNotImpersonating(tenant);

      const parsed = updateLeadSchema.safeParse(input);
      if (!parsed.success) {
        throw new AppError("Invalid lead data", "VALIDATION_ERROR", 400);
      }

      const lead = await prisma.lead.findFirst({
        where: { id: leadId, companyId: tenant.companyId },
      });
      if (!lead) {
        throw new AppError("Lead not found", "NOT_FOUND", 404);
      }

      const data = parsed.data;
      const updates: Record<string, unknown> = {};
      const oldValues: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          const k = key as keyof typeof lead;
          oldValues[key] = lead[k];
          updates[key] = value === "" ? null : value;
        }
      }

      if (Object.keys(updates).length === 0) {
        return { success: true };
      }

      await prisma.$transaction([
        prisma.lead.update({
          where: { id: leadId },
          data: updates,
        }),
        prisma.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "LEAD_UPDATE",
            entity: "Lead",
            entityId: leadId,
            oldValues: oldValues as unknown as Prisma.InputJsonValue,
            newValues: updates as unknown as Prisma.InputJsonValue,
          },
        }),
      ]);

      revalidatePath("/leads");
      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
