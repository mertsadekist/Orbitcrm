"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

const createCompanySchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companySlug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  plan: z.enum(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"]),
  maxUsers: z.number().min(1).max(1000),
  maxQuizzes: z.number().min(1).max(1000),
  // Owner user details
  ownerFirstName: z.string().min(1, "First name is required"),
  ownerLastName: z.string().min(1, "Last name is required"),
  ownerEmail: z.string().email("Invalid email address"),
  ownerUsername: z.string().min(3, "Username must be at least 3 characters"),
  ownerPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function createCompany(input: z.infer<typeof createCompanySchema>) {
  const tenant = await getTenant();

  return withErrorHandling(
    "createCompany",
    async () => {
      // Only SUPER_ADMIN can create companies
      if (tenant.role !== "SUPER_ADMIN") {
        throw new AppError("Access denied", "FORBIDDEN", 403);
      }

      // Validate input
      const validated = createCompanySchema.parse(input);

      // Check if slug is unique
      const existingCompany = await prisma.company.findUnique({
        where: { slug: validated.companySlug },
      });

      if (existingCompany) {
        throw new AppError("Company slug already exists", "CONFLICT", 409);
      }

      // Check if email is unique across all companies
      const existingUser = await prisma.user.findFirst({
        where: { email: validated.ownerEmail },
      });

      if (existingUser) {
        throw new AppError("Email already exists", "CONFLICT", 409);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(validated.ownerPassword, 10);

      // Create company and owner user in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create company
        const company = await tx.company.create({
          data: {
            subscriptionId: String(Math.floor(100000 + Math.random() * 900000)),
            name: validated.companyName,
            slug: validated.companySlug,
            plan: validated.plan,
            maxUsers: validated.maxUsers,
            maxQuizzes: validated.maxQuizzes,
            isActive: true,
          },
        });

        // Create owner user
        const owner = await tx.user.create({
          data: {
            companyId: company.id,
            firstName: validated.ownerFirstName,
            lastName: validated.ownerLastName,
            email: validated.ownerEmail,
            username: validated.ownerUsername,
            passwordHash,
            role: "OWNER",
            isActive: true,
            permissions: {
              canManageUsers: true,
              canViewAnalytics: true,
              canExportData: true,
              canBulkActions: true,
            } as any,
          },
        });

        // Log to system log
        await tx.systemLog.create({
          data: {
            level: "INFO",
            message: "Super admin created new company",
            source: "SUPER_ADMIN",
            userId: tenant.userId,
            companyId: company.id,
            metadata: {
              action: "CREATE_COMPANY",
              companyName: company.name,
              companySlug: company.slug,
              ownerEmail: owner.email,
            } as any,
          },
        });

        return { company, owner };
      });

      revalidatePath("/super-admin/companies");

      return {
        companyId: result.company.id,
        companyName: result.company.name,
        ownerId: result.owner.id,
        ownerEmail: result.owner.email,
      };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
