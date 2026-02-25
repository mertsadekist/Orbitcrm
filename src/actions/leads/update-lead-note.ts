"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant, hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";
import type { LeadNote } from "@/types/lead";

export async function updateLeadNote(
  leadId: string,
  noteId: string,
  content: string
) {
  const tenant = await getTenant();

  return withErrorHandling(
    "updateLeadNote",
    async () => {
      assertNotImpersonating(tenant);

      // Only ADMIN, OWNER, and MANAGER can edit notes
      if (!hasMinimumRole(tenant.role, "MANAGER")) {
        throw new AppError(
          "Only ADMIN, OWNER, and MANAGER can edit notes",
          "FORBIDDEN",
          403
        );
      }

      const lead = await prisma.lead.findFirst({
        where: { id: leadId, companyId: tenant.companyId },
      });
      if (!lead) {
        throw new AppError("Lead not found", "NOT_FOUND", 404);
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: tenant.userId },
        select: { id: true, firstName: true, lastName: true },
      });
      if (!user) {
        throw new AppError("User not found", "NOT_FOUND", 404);
      }

      // Parse existing notes or start with empty array
      let existingNotes: LeadNote[] = [];
      if (lead.notes && Array.isArray(lead.notes)) {
        existingNotes = lead.notes as LeadNote[];
      }

      // Find and update the note
      const noteIndex = existingNotes.findIndex((n) => n.id === noteId);
      if (noteIndex === -1) {
        throw new AppError("Note not found", "NOT_FOUND", 404);
      }

      const updatedNotes = [...existingNotes];
      updatedNotes[noteIndex] = {
        ...updatedNotes[noteIndex],
        content: content.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
        },
      };

      await prisma.$transaction([
        prisma.lead.update({
          where: { id: leadId },
          data: {
            notes: updatedNotes as unknown as Prisma.InputJsonValue,
          },
        }),
        prisma.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "LEAD_UPDATE",
            entity: "Lead",
            entityId: leadId,
            oldValues: {
              action: "note_updated",
              noteId,
              oldContent: existingNotes[noteIndex].content,
            } as unknown as Prisma.InputJsonValue,
            newValues: {
              noteId,
              newContent: content.trim(),
            } as unknown as Prisma.InputJsonValue,
          },
        }),
      ]);

      revalidatePath("/leads");
      return { success: true, note: updatedNotes[noteIndex] };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
