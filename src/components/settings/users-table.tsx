"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, Pencil, Power, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { toggleUserStatus } from "@/actions/users/toggle-user-status";
import { EditUserSheet } from "@/components/settings/edit-user-sheet";
import type { SerializedUser } from "@/types/user-management";
import type { Role } from "@/generated/prisma/client";
import { formatRelativeTime } from "@/lib/lead-utils";

const ROLE_LEVELS: Record<string, number> = {
  EMPLOYEE: 1,
  MANAGER: 2,
  OWNER: 3,
  SUPER_ADMIN: 4,
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  MANAGER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  EMPLOYEE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  SUPER_ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

type UsersTableProps = {
  users: SerializedUser[];
  currentUserId: string;
  currentUserRole: Role;
};

export function UsersTable({
  users,
  currentUserId,
  currentUserRole,
}: UsersTableProps) {
  const [editingUser, setEditingUser] = useState<SerializedUser | null>(null);
  const isOwner = (ROLE_LEVELS[currentUserRole] ?? 0) >= ROLE_LEVELS.OWNER;

  async function handleToggleStatus(userId: string) {
    const result = await toggleUserStatus(userId);
    if (result.success) {
      toast.success(
        result.data.isActive ? "User reactivated" : "User deactivated"
      );
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Leads</TableHead>
              <TableHead>Last Login</TableHead>
              {isOwner && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const initials = (
                (user.firstName[0] ?? "") + (user.lastName[0] ?? "")
              ).toUpperCase();
              const isSelf = user.id === currentUserId;

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {user.firstName} {user.lastName}
                          {isSelf && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={ROLE_COLORS[user.role] ?? ""}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.isActive
                          ? "border-green-300 text-green-700 dark:text-green-400"
                          : "border-red-300 text-red-700 dark:text-red-400"
                      }
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {user._count.assignedLeads}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.lastLoginAt
                      ? formatRelativeTime(user.lastLoginAt)
                      : "Never"}
                  </TableCell>
                  {isOwner && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingUser(user)}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          {!isSelf && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(user.id)}
                              >
                                <Power className="mr-2 h-3.5 w-3.5" />
                                {user.isActive ? "Deactivate" : "Reactivate"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={isOwner ? 7 : 6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EditUserSheet
        user={editingUser}
        onClose={() => setEditingUser(null)}
        currentUserRole={currentUserRole}
      />
    </>
  );
}
