"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { updateUser } from "@/actions/users/update-user";
import { resetPassword } from "@/actions/users/reset-password";
import { PermissionsGrid } from "@/components/settings/permissions-grid";
import type { SerializedUser } from "@/types/user-management";
import type { Role } from "@/generated/prisma/client";

const ROLE_LEVELS: Record<string, number> = {
  EMPLOYEE: 1,
  MANAGER: 2,
  OWNER: 3,
  SUPER_ADMIN: 4,
};

type EditUserSheetProps = {
  user: SerializedUser | null;
  onClose: () => void;
  currentUserRole: Role;
};

export function EditUserSheet({
  user,
  onClose,
  currentUserRole,
}: EditUserSheetProps) {
  const isOwner = (ROLE_LEVELS[currentUserRole] ?? 0) >= ROLE_LEVELS.OWNER;

  return (
    <Sheet open={!!user} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {user ? user.firstName + " " + user.lastName : "Edit User"}
          </SheetTitle>
        </SheetHeader>

        {user && (
          <Tabs defaultValue="profile" className="mt-4">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="role">Role</TabsTrigger>
              <TabsTrigger value="permissions">Perms</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4">
              <ProfileTab user={user} />
            </TabsContent>

            <TabsContent value="role" className="mt-4">
              <RoleTab user={user} isOwner={isOwner} />
            </TabsContent>

            <TabsContent value="permissions" className="mt-4">
              <PermissionsGrid
                userId={user.id}
                role={user.role}
                permissions={user.permissions}
              />
            </TabsContent>

            <TabsContent value="security" className="mt-4">
              <SecurityTab user={user} isOwner={isOwner} />
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ProfileTab({ user }: { user: SerializedUser }) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateUser(user.id, {
      firstName,
      lastName,
      email,
      phone,
    });
    setSaving(false);
    if (result.success) {
      toast.success("Profile updated");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}

function RoleTab({
  user,
  isOwner,
}: {
  user: SerializedUser;
  isOwner: boolean;
}) {
  const [role, setRole] = useState<string>(user.role);
  const [saving, setSaving] = useState(false);

  async function handleSaveRole() {
    if (role === user.role) return;
    setSaving(true);
    const result = await updateUser(user.id, {
      role: role as "MANAGER" | "EMPLOYEE",
    });
    setSaving(false);
    if (result.success) {
      toast.success("Role updated");
    } else {
      toast.error(result.error);
    }
  }

  if (!isOwner) {
    return (
      <p className="text-sm text-muted-foreground">
        Only owners can change user roles.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EMPLOYEE">Employee</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Managers have full permissions by default. Employee permissions can be
          customized in the Permissions tab.
        </p>
      </div>
      {role !== user.role && (
        <Button onClick={handleSaveRole} disabled={saving}>
          {saving ? "Saving..." : "Update Role"}
        </Button>
      )}
    </div>
  );
}

function SecurityTab({
  user,
  isOwner,
}: {
  user: SerializedUser;
  isOwner: boolean;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleReset() {
    if (!newPassword) return;
    setSaving(true);
    const result = await resetPassword(user.id, { newPassword });
    setSaving(false);
    if (result.success) {
      toast.success("Password reset successfully");
      setNewPassword("");
    } else {
      toast.error(result.error);
    }
  }

  if (!isOwner) {
    return (
      <p className="text-sm text-muted-foreground">
        Only owners can reset passwords.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>New Password</Label>
        <Input
          type="text"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Min 8 characters. Must include uppercase, lowercase, number, and
          special character.
        </p>
      </div>
      <Button
        onClick={handleReset}
        disabled={saving || !newPassword}
        variant="destructive"
      >
        {saving ? "Resetting..." : "Reset Password"}
      </Button>
    </div>
  );
}
