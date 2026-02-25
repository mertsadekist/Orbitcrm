"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

const createCompanyUserSchema = z.object({
  companyId: z.string().cuid(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["EMPLOYEE", "MANAGER", "OWNER"]),
});

export async function createCompanyUser(input: z.infer<typeof createCompanyUserSchema>) {
  const tenant = await getTenant();

  return withErrorHandling(
    "createCompanyUser",
    async () => {
      // Only SUPER_ADMIN can create users for other companies
      if (tenant.role !== "SUPER_ADMIN") {
        throw new AppError("Access denied", "FORBIDDEN", 403);
      }

      // Validate input
      const validated = createCompanyUserSchema.parse(input);

      // Verify company exists
      const company = await prisma.company.findUnique({
        where: { id: validated.companyId },
        select: {
          id: true,
          name: true,
          maxUsers: true,
          _count: {
            select: { users: true },
          },
        },
      });

      if (!company) {
        throw new AppError("Company not found", "NOT_FOUND", 404);
      }

      // Check user quota
      if (company._count.users >= company.maxUsers) {
        throw new AppError(
          `Company has reached maximum users (${company.maxUsers})`,
          "CONFLICT",
          409
        );
      }

      // Check if email is unique across all companies
      const existingUser = await prisma.user.findFirst({
        where: { email: validated.email },
      });

      if (existingUser) {
        throw new AppError("Email already exists", "CONFLICT", 409);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(validated.password, 10);

      // Set default permissions based on role
      const permissions = {
        canManageUsers: validated.role === "OWNER" || validated.role === "MANAGER",
        canViewAnalytics: validated.role === "OWNER" || validated.role === "MANAGER",
        canExportData: validated.role === "OWNER",
        canBulkActions: validated.role === "OWNER" || validated.role === "MANAGER",
      };

      // Create user in a transaction
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            companyId: validated.companyId,
            firstName: validated.firstName,
            lastName: validated.lastName,
            email: validated.email,
            username: validated.username,
            passwordHash,
            role: validated.role,
            isActive: true,
            permissions: permissions as any,
          },
        });

        // Log to system log
        await tx.systemLog.create({
          data: {
            level: "INFO",
            message: "Super admin created user for company",
            source: "SUPER_ADMIN",
            userId: tenant.userId,
            companyId: validated.companyId,
            metadata: {
              action: "CREATE_COMPANY_USER",
              companyName: company.name,
              newUserId: newUser.id,
              newUserEmail: newUser.email,
              newUserRole: newUser.role,
            } as any,
          },
        });

        return newUser;
      });

      revalidatePath("/super-admin/companies");

      return {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
    },
    { userId: tenant.userId, companyId: tenant.companyId }
  );
}
