"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

const createLeadSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  companyName: z.string().max(200).optional(),
  assignedToId: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().max(5000).optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export async function createLead(input: CreateLeadInput) {
  const tenant = await getTenant();

  return withErrorHandling(
    "createLead",
    async () => {
      assertNotImpersonating(tenant);

      const parsed = createLeadSchema.safeParse(input);
      if (!parsed.success) {
        throw new AppError("Invalid lead data", "VALIDATION_ERROR", 400);
      }

      const data = parsed.data;

      if (data.assignedToId) {
        const user = await prisma.user.findFirst({
          where: {
            id: data.assignedToId,
            companyId: tenant.companyId,
            isActive: true,
          },
        });
        if (!user) {
          throw new AppError("Assigned user not found", "VALIDATION_ERROR", 400);
        }
      }

      const [lead] = await prisma.$transaction([
        prisma.lead.create({
          data: {
            companyId: tenant.companyId,
            firstName: data.firstName,
            lastName: data.lastName ?? null,
            email: data.email || null,
            phone: data.phone || null,
            companyName: data.companyName || null,
            assignedToId: data.assignedToId || null,
            source: "manual",
            status: "NEW",
            score: data.score ?? 0,
          },
        }),
        prisma.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "LEAD_CREATE",
            entity: "Lead",
            newValues: {
              firstName: data.firstName,
              source: "manual",
            } as unknown as Prisma.InputJsonValue,
          },
        }),
      ]);

      revalidatePath("/leads");
      return { id: lead.id };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
