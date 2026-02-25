import type { NextAuthConfig } from "next-auth";

const publicRoutes = [
  "/login",
  "/api/auth",
  "/api/public",
  "/api/log-error",
];

const publicPrefixes = [
  "/quiz/",
  "/q/",
  "/api/auth/",
  "/api/public/",
];

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) return true;
  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export default {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Public routes — always accessible
      if (isPublicRoute(pathname)) {
        // Redirect logged-in users away from /login
        if (pathname === "/login" && isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Super admin routes — requires SUPER_ADMIN role
      if (pathname.startsWith("/super-admin")) {
        if (!isLoggedIn) return false;
        if (auth?.user?.role !== "SUPER_ADMIN") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Everything else — requires auth
      return isLoggedIn;
    },
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
