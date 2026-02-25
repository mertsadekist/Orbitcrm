import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import type { Role } from "@/generated/prisma/client";
import type { UserPermissions } from "@/types/user-management";
import { getEffectivePermissions } from "@/lib/auth/permissions";

export type TenantContext = {
  userId: string;
  companyId: string;
  role: Role;
  subscriptionId: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  permissions: UserPermissions;
  isImpersonating: boolean;
  originalUserId?: string;
  originalCompanyId?: string;
};

const ROLE_HIERARCHY: Record<Role, number> = {
  EMPLOYEE: 1,
  MANAGER: 2,
  OWNER: 3,
  SUPER_ADMIN: 4,
};

export async function getTenant(): Promise<TenantContext> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return {
    userId: session.user.id,
    companyId: session.user.companyId,
    role: session.user.role,
    subscriptionId: session.user.subscriptionId,
    username: session.user.username,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    email: session.user.email!,
    permissions: getEffectivePermissions(session.user.role, session.user.permissions),
    isImpersonating: session.user.isImpersonating ?? false,
    originalUserId: session.user.originalUserId,
    originalCompanyId: session.user.originalCompanyId,
  };
}

export async function getTenantOrNull(): Promise<TenantContext | null> {
  const session = await auth();
  if (!session?.user) return null;

  return {
    userId: session.user.id,
    companyId: session.user.companyId,
    role: session.user.role,
    subscriptionId: session.user.subscriptionId,
    username: session.user.username,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    email: session.user.email!,
    permissions: getEffectivePermissions(session.user.role, session.user.permissions),
    isImpersonating: session.user.isImpersonating ?? false,
    originalUserId: session.user.originalUserId,
    originalCompanyId: session.user.originalCompanyId,
  };
}

export function hasMinimumRole(current: Role, required: Role): boolean {
  return ROLE_HIERARCHY[current] >= ROLE_HIERARCHY[required];
}
