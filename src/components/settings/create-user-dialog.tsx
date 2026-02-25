"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { createUser } from "@/actions/users/create-user";
import {
  createUserSchema,
  type CreateUserInput,
} from "@/lib/validators/user-schema";

type CreateUserDialogProps = {
  isQuotaFull: boolean;
};

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const special = "!@#$%&*";
  let pw = "";
  for (let i = 0; i < 10; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  pw += special[Math.floor(Math.random() * special.length)];
  pw += String(Math.floor(Math.random() * 10));
  return pw;
}

export function CreateUserDialog({ isQuotaFull }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "EMPLOYEE",
    },
  });

  async function onSubmit(data: CreateUserInput) {
    setLoading(true);
    try {
      const result = await createUser(data);
      if (result.success) {
        toast.success("User created successfully");
        form.reset();
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={isQuotaFull}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...form.register("firstName")} />
              {form.formState.errors.firstName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...form.register("lastName")} />
              {form.formState.errors.lastName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="john.doe"
              {...form.register("username")}
            />
            {form.formState.errors.username && (
              <p className="text-xs text-destructive">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type="text"
                {...form.register("password")}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => form.setValue("password", generatePassword())}
                title="Generate random password"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.watch("role")}
                onValueChange={(v) =>
                  form.setValue("role", v as "MANAGER" | "EMPLOYEE")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
