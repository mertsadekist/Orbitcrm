import { AppError } from "@/lib/logger";
import type { TenantContext } from "@/lib/auth/get-tenant";

export function assertNotImpersonating(tenant: TenantContext): void {
  if (tenant.isImpersonating) {
    throw new AppError(
      "Write operations are disabled during impersonation",
      "FORBIDDEN",
      403
    );
  }
}
