import type { Role } from "@/generated/prisma/client";
import type { UserPermissions } from "@/types/user-management";

export const DEFAULT_PERMISSIONS: UserPermissions = {
  canExportData: false,
  canDeleteLeads: false,
  canDeleteDeals: false,
  canViewAnalytics: false,
  canManageQuizzes: false,
  canBulkActions: false,
};

export const ALL_PERMISSIONS_GRANTED: UserPermissions = {
  canExportData: true,
  canDeleteLeads: true,
  canDeleteDeals: true,
  canViewAnalytics: true,
  canManageQuizzes: true,
  canBulkActions: true,
};

export function getEffectivePermissions(
  role: Role,
  permissions?: Record<string, boolean> | null
): UserPermissions {
  if (role === "SUPER_ADMIN" || role === "OWNER" || role === "MANAGER") {
    return ALL_PERMISSIONS_GRANTED;
  }
  return { ...DEFAULT_PERMISSIONS, ...(permissions as Partial<UserPermissions>) };
}

export function hasPermission(
  role: Role,
  permissions: UserPermissions | null | undefined,
  key: keyof UserPermissions
): boolean {
  if (role === "SUPER_ADMIN" || role === "OWNER" || role === "MANAGER") {
    return true;
  }
  if (!permissions) return DEFAULT_PERMISSIONS[key];
  return permissions[key] ?? DEFAULT_PERMISSIONS[key];
}

export const PERMISSION_DEFINITIONS: Array<{
  key: keyof UserPermissions;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    key: "canExportData",
    label: "Export Data",
    description: "Export leads and analytics data as CSV",
    icon: "Download",
  },
  {
    key: "canDeleteLeads",
    label: "Delete Leads",
    description: "Permanently delete lead records",
    icon: "Trash2",
  },
  {
    key: "canDeleteDeals",
    label: "Delete Deals",
    description: "Permanently delete deal records",
    icon: "Trash2",
  },
  {
    key: "canViewAnalytics",
    label: "View Analytics",
    description: "Access the analytics dashboard",
    icon: "BarChart3",
  },
  {
    key: "canManageQuizzes",
    label: "Manage Quizzes",
    description: "Create, edit, and publish quizzes",
    icon: "FileQuestion",
  },
  {
    key: "canBulkActions",
    label: "Bulk Actions",
    description: "Perform bulk assign and status changes",
    icon: "Zap",
  },
];
