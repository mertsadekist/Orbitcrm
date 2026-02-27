"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling } from "@/lib/logger";
import { assertNotImpersonating } from "@/lib/auth/impersonation-guard";

const importRowSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  email: z
    .string()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  phone: z.string().max(30).optional(),
  companyName: z.string().max(200).optional(),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().max(5000).optional(),
});

export type ImportLeadInput = z.infer<typeof importRowSchema>;

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

export async function importLeads(rows: ImportLeadInput[]) {
  const tenant = await getTenant();

  return withErrorHandling(
    "importLeads",
    async () => {
      assertNotImpersonating(tenant);

      if (!Array.isArray(rows) || rows.length === 0) {
        return { imported: 0, skipped: 0, errors: [] } satisfies ImportResult;
      }

      if (rows.length > 500) {
        return {
          imported: 0,
          skipped: 0,
          errors: ["Maximum 500 rows allowed per import."],
        } satisfies ImportResult;
      }

      // Validate all rows
      const validRows: z.infer<typeof importRowSchema>[] = [];
      const errors: string[] = [];

      rows.forEach((row, i) => {
        const result = importRowSchema.safeParse(row);
        if (result.success) {
          validRows.push(result.data);
        } else {
          errors.push(`Row ${i + 1}: ${result.error.issues[0]?.message ?? "Invalid data"}`);
        }
      });

      // Collect emails from valid rows to check for existing duplicates
      const emailsInBatch = validRows
        .map((r) => r.email)
        .filter((e): e is string => !!e);

      // Also deduplicate within the batch itself (keep first occurrence)
      const seenEmails = new Set<string>();
      const deduplicatedRows: z.infer<typeof importRowSchema>[] = [];

      for (const row of validRows) {
        if (row.email) {
          if (seenEmails.has(row.email.toLowerCase())) {
            errors.push(
              `Duplicate email "${row.email}" in file — only the first occurrence was imported.`
            );
            continue;
          }
          seenEmails.add(row.email.toLowerCase());
        }
        deduplicatedRows.push(row);
      }

      // Find existing leads in this company with the same email
      let existingEmails = new Set<string>();
      if (emailsInBatch.length > 0) {
        const existing = await prisma.lead.findMany({
          where: {
            companyId: tenant.companyId,
            email: { in: emailsInBatch, mode: "insensitive" },
          },
          select: { email: true },
        });
        existingEmails = new Set(
          existing.map((l) => (l.email ?? "").toLowerCase())
        );
      }

      // Split into new leads vs skipped duplicates
      const toInsert: z.infer<typeof importRowSchema>[] = [];
      let skipped = 0;

      for (const row of deduplicatedRows) {
        if (row.email && existingEmails.has(row.email.toLowerCase())) {
          skipped++;
          errors.push(
            `"${row.email}" already exists in your leads — skipped.`
          );
        } else {
          toInsert.push(row);
        }
      }

      if (toInsert.length === 0) {
        return { imported: 0, skipped, errors } satisfies ImportResult;
      }

      // Bulk insert
      await prisma.$transaction([
        prisma.lead.createMany({
          data: toInsert.map((row) => ({
            companyId: tenant.companyId,
            firstName: row.firstName,
            lastName: row.lastName ?? null,
            email: row.email || null,
            phone: row.phone || null,
            companyName: row.companyName || null,
            source: "import",
            status: "NEW",
            score: row.score ?? 0,
            notes: row.notes
              ? ([
                  {
                    id: crypto.randomUUID(),
                    content: row.notes,
                    createdAt: new Date().toISOString(),
                    createdBy: { id: tenant.userId, name: "Import" },
                  },
                ] as unknown as Prisma.InputJsonValue)
              : undefined,
          })),
        }),
        // Single audit log for the entire import batch
        prisma.auditLog.create({
          data: {
            companyId: tenant.companyId,
            userId: tenant.userId,
            action: "LEAD_IMPORT",
            entity: "Lead",
            newValues: {
              count: toInsert.length,
              source: "import",
            } as unknown as Prisma.InputJsonValue,
          },
        }),
      ]);

      revalidatePath("/leads");

      return {
        imported: toInsert.length,
        skipped,
        errors,
      } satisfies ImportResult;
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
