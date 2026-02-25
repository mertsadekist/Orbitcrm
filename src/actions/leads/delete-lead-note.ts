"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant, hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";
import type { LeadNote } from "@/types/lead";

export async function deleteLeadNote(leadId: string, noteId: string) {
  const tenant = await getTenant();

  return withErrorHandling(
    "deleteLeadNote",
    async () => {
      assertNotImpersonating(tenant);

      // Only ADMIN, OWNER, and MANAGER can delete notes
      if (!hasMinimumRole(tenant.role, "MANAGER")) {
        throw new AppError(
          "Only ADMIN, OWNER, and MANAGER can delete notes",
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

      // Parse existing notes or start with empty array
      let existingNotes: LeadNote[] = [];
      if (lead.notes && Array.isArray(lead.notes)) {
        existingNotes = lead.notes as LeadNote[];
      }

      // Find the note to delete
      const noteToDelete = existingNotes.find((n) => n.id === noteId);
      if (!noteToDelete) {
        throw new AppError("Note not found", "NOT_FOUND", 404);
      }

      // Filter out the deleted note
      const updatedNotes = existingNotes.filter((n) => n.id !== noteId);

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
              action: "note_deleted",
              noteId,
              content: noteToDelete.content,
            } as unknown as Prisma.InputJsonValue,
            newValues: {
              noteId,
            } as unknown as Prisma.InputJsonValue,
          },
        }),
      ]);

      revalidatePath("/leads");
      return { success: true };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
