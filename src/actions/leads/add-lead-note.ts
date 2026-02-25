"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";
import type { LeadNote } from "@/types/lead";

export async function addLeadNote(leadId: string, content: string) {
  const tenant = await getTenant();

  console.log('[addLeadNote] Starting with:', { leadId, content, tenant });

  return withErrorHandling(
    "addLeadNote",
    async () => {
      assertNotImpersonating(tenant);

      const lead = await prisma.lead.findFirst({
        where: { id: leadId, companyId: tenant.companyId },
      });
      console.log('[addLeadNote] Lead found:', lead ? 'yes' : 'no');
      if (!lead) {
        throw new AppError("Lead not found", "NOT_FOUND", 404);
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: tenant.userId },
        select: { id: true, firstName: true, lastName: true },
      });
      console.log('[addLeadNote] User found:', user);
      if (!user) {
        throw new AppError("User not found", "NOT_FOUND", 404);
      }

      // Parse existing notes or start with empty array
      let existingNotes: LeadNote[] = [];
      console.log('[addLeadNote] lead.notes type:', typeof lead.notes, 'isArray:', Array.isArray(lead.notes), 'value:', lead.notes);
      if (lead.notes && Array.isArray(lead.notes)) {
        existingNotes = lead.notes as LeadNote[];
      }
      console.log('[addLeadNote] existingNotes:', existingNotes);

      // Create new note
      const newNote: LeadNote = {
        id: randomUUID(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
        createdBy: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
        },
      };
      console.log('[addLeadNote] newNote created:', newNote);

      // Append new note to array
      const updatedNotes = [...existingNotes, newNote];
      console.log('[addLeadNote] updatedNotes:', updatedNotes);
      console.log('[addLeadNote] Starting transaction...');

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
              action: "note_added",
            } as unknown as Prisma.InputJsonValue,
            newValues: {
              noteId: newNote.id,
              content: newNote.content,
            } as unknown as Prisma.InputJsonValue,
          },
        }),
      ]);

      console.log('[addLeadNote] Transaction completed successfully');
      revalidatePath("/leads");
      console.log('[addLeadNote] Path revalidated, returning success');
      return { success: true, note: newNote };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
