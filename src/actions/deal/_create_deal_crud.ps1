"
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTenant } from "@/lib/auth/get-tenant";
import { hasMinimumRole } from "@/lib/auth/get-tenant";
import { withErrorHandling, AppError } from "@/lib/logger";
import type { SerializedDeal, DealFilters } from "@/types/deal";
"@

[System.IO.File]::WriteAllText('c:\Users\MertSadek\Documents\Saas-CRM-V0.1\src\actions\deal\deal-crud.ts', ))