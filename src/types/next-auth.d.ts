import { type Role } from "@/generated/prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    companyId: string;
    role: Role;
    subscriptionId: string;
    username: string;
    firstName: string;
    lastName: string;
    permissions: Record<string, boolean> | null;
    isImpersonating?: boolean;
    originalUserId?: string;
    originalCompanyId?: string;
  }

  interface Session {
    user: User & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    companyId: string;
    role: Role;
    subscriptionId: string;
    username: string;
    firstName: string;
    lastName: string;
    permissions: Record<string, boolean> | null;
    isImpersonating?: boolean;
    originalUserId?: string;
    originalCompanyId?: string;
  }
}
