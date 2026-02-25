import type { Role } from "@/generated/prisma/client";

export interface UserPermissions {
  canExportData: boolean;
  canDeleteLeads: boolean;
  canDeleteDeals: boolean;
  canViewAnalytics: boolean;
  canManageQuizzes: boolean;
  canBulkActions: boolean;
}

export interface SerializedUser {
  id: string;
  companyId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  phone: string | null;
  role: Role;
  isActive: boolean;
  permissions: UserPermissions;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    assignedLeads: number;
    assignedDeals: number;
  };
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "MANAGER" | "EMPLOYEE";
  permissions?: Partial<UserPermissions>;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: "MANAGER" | "EMPLOYEE";
  isActive?: boolean;
}

export interface SerializedAuditLog {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null;
}
