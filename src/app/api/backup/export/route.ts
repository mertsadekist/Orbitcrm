import { NextRequest, NextResponse } from "next/server";
import { getTenantOrNull } from "@/lib/auth/get-tenant";
import { buildBackupZip } from "@/lib/backup/zip-builder";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantOrNull();

    // Auth check: OWNER or SUPER_ADMIN only
    if (!tenant || (tenant.role !== "OWNER" && tenant.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Only company owners and super admins can download backups" },
        { status: 403 }
      );
    }

    // Get optional companyId from query params (super admin can backup any company)
    const searchParams = request.nextUrl.searchParams;
    const requestedCompanyId = searchParams.get("companyId");

    // Determine target company
    let targetCompanyId: string;

    if (tenant.role === "SUPER_ADMIN" && requestedCompanyId) {
      // Super admin can backup any company
      targetCompanyId = requestedCompanyId;
    } else {
      // Owner can only backup their own company
      targetCompanyId = tenant.companyId;
    }

    // Get company info for filename
    const company = await prisma.company.findUnique({
      where: { id: targetCompanyId },
      select: { name: true, slug: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Build backup ZIP stream
    const zipStream = await buildBackupZip(targetCompanyId, company.name);

    // Log to audit log (both actor's company and target company for super admin)
    if (tenant.role === "SUPER_ADMIN" && targetCompanyId !== tenant.companyId) {
      // Log to system log for super admin cross-company backup
      await prisma.systemLog.create({
        data: {
          level: "INFO",
          message: "Super admin downloaded company backup",
          source: "SUPER_ADMIN",
          userId: tenant.userId,
          companyId: targetCompanyId,
          metadata: {
            action: "DOWNLOAD_BACKUP",
            targetCompanyId: targetCompanyId,
            companyName: company.name,
            exportedAt: new Date().toISOString(),
          } as any,
        },
      });
    }

    // Log to audit log for the target company
    await prisma.auditLog.create({
      data: {
        action: "DOWNLOAD_BACKUP",
        entity: "COMPANY",
        entityId: targetCompanyId,
        userId: tenant.userId,
        companyId: targetCompanyId,
        newValues: {
          companyName: company.name,
          exportedAt: new Date().toISOString(),
          downloadedBy: tenant.role === "SUPER_ADMIN" ? "Super Admin" : "Owner",
        } as any,
      },
    });

    // Generate filename with date
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const filename = `orbitflow-backup-${company.slug}-${date}.zip`;

    // Return ZIP stream with proper headers
    return new Response(zipStream as any, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Backup export error:", error);
    return NextResponse.json(
      { error: "Failed to generate backup" },
      { status: 500 }
    );
  }
}
