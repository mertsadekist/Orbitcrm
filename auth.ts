import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        subscriptionId: { label: "Subscription ID" },
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { subscriptionId, username, password } = credentials as {
          subscriptionId: string;
          username: string;
          password: string;
        };

        if (!subscriptionId || !username || !password) return null;

        // Find company by subscriptionId
        const company = await prisma.company.findUnique({
          where: { subscriptionId },
        });

        if (!company || !company.isActive) return null;

        // Find user by compound key (companyId + username)
        const user = await prisma.user.findUnique({
          where: {
            companyId_username: {
              companyId: company.id,
              username,
            },
          },
        });

        if (!user || !user.isActive) return null;

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // Update lastLoginAt + create audit log
        await Promise.all([
          prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          }),
          prisma.auditLog.create({
            data: {
              companyId: company.id,
              userId: user.id,
              action: "LOGIN",
              entity: "User",
              entityId: user.id,
            },
          }),
        ]);

        return {
          id: user.id,
          companyId: company.id,
          role: user.role,
          subscriptionId: company.subscriptionId,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          permissions: user.permissions as Record<string, boolean> | null,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.companyId = user.companyId;
        token.role = user.role;
        token.subscriptionId = user.subscriptionId;
        token.username = user.username;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.permissions = user.permissions;
        token.isImpersonating = false;
      }

      // Handle session updates (impersonation start/stop)
      if (trigger === "update" && session) {
        const s = session as Record<string, unknown>;
        if (s.isImpersonating !== undefined) {
          token.isImpersonating = s.isImpersonating as boolean;
          token.companyId = s.companyId as string;
          token.originalUserId = s.originalUserId as string | undefined;
          token.originalCompanyId = s.originalCompanyId as string | undefined;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.companyId = token.companyId as string;
      session.user.role = token.role as import("@/generated/prisma/client").Role;
      session.user.subscriptionId = token.subscriptionId as string;
      session.user.username = token.username as string;
      session.user.firstName = token.firstName as string;
      session.user.lastName = token.lastName as string;
      session.user.permissions = token.permissions as Record<string, boolean> | null;
      session.user.isImpersonating = (token.isImpersonating as boolean) ?? false;
      session.user.originalUserId = token.originalUserId as string | undefined;
      session.user.originalCompanyId = token.originalCompanyId as string | undefined;
      return session;
    },
  },
});
