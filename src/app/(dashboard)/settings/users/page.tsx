import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenant, hasMinimumRole } from "@/lib/auth/get-tenant";
import { getUsers } from "@/actions/users/get-users";
import { UserQuotaBar } from "@/components/settings/user-quota-bar";
import { UsersTable } from "@/components/settings/users-table";
import { CreateUserDialog } from "@/components/settings/create-user-dialog";

export default async function UsersPage() {
  const tenant = await getTenant();

  if (!hasMinimumRole(tenant.role, "MANAGER")) {
    redirect("/dashboard");
  }

  const [usersResult, company] = await Promise.all([
    getUsers(),
    prisma.company.findUnique({
      where: { id: tenant.companyId },
      select: { maxUsers: true },
    }),
  ]);

  const users = usersResult.success ? usersResult.data : [];
  const maxUsers = company?.maxUsers ?? 5;
  const activeCount = users.filter((u) => u.isActive).length;
  const isOwner = hasMinimumRole(tenant.role, "OWNER");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Team Members</h2>
          <p className="text-sm text-muted-foreground">
            Manage your team and their permissions
          </p>
        </div>
        {isOwner && (
          <CreateUserDialog
            isQuotaFull={activeCount >= maxUsers}
          />
        )}
      </div>

      <UserQuotaBar activeCount={activeCount} maxUsers={maxUsers} />

      <UsersTable
        users={users}
        currentUserId={tenant.userId}
        currentUserRole={tenant.role}
      />
    </div>
  );
}
