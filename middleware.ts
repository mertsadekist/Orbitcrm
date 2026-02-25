import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Decode the JWT directly from the cookie — bypasses session callback,
  // reads custom fields (role, companyId, etc.) straight from the token payload.
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    // NextAuth v5 encrypts cookies; getToken handles JWE decryption automatically.
  });

  const isLoggedIn = !!token;

  // Public routes — always accessible
  if (isPublicRoute(pathname)) {
    // Redirect logged-in users away from /login
    if (pathname === "/login" && isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    }
    return NextResponse.next();
  }

  // Super admin routes — requires SUPER_ADMIN role
  if (pathname.startsWith("/super-admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.nextUrl));
    }
    if (token.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    }
    return NextResponse.next();
  }

  // Everything else — requires auth
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip static files and Next.js internals
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
