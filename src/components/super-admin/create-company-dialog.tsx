"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createCompany } from "@/actions/super-admin/create-company";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Loader2, Plus } from "lucide-react";

const formSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companySlug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  plan: z.enum(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"]),
  maxUsers: z.number().min(1).max(1000),
  maxQuizzes: z.number().min(1).max(1000),
  ownerFirstName: z.string().min(1, "First name is required"),
  ownerLastName: z.string().min(1, "Last name is required"),
  ownerEmail: z.string().email("Invalid email address"),
  ownerUsername: z.string().min(3, "Username must be at least 3 characters"),
  ownerPassword: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof formSchema>;

export function CreateCompanyDialog({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plan: "FREE",
      maxUsers: 5,
      maxQuizzes: 3,
    },
  });

  const plan = watch("plan");

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const result = await createCompany(data);

    if (!result.success) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success(`Company "${result.data.companyName}" created successfully`);
    reset();
    setOpen(false);
    setIsSubmitting(false);
    router.refresh();
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Company
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Company</DialogTitle>
          <DialogDescription>
            Create a new company with an initial owner user
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Company Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  {...register("companyName")}
                  placeholder="Acme Corp"
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive">{errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySlug">Slug</Label>
                <Input
                  id="companySlug"
                  {...register("companySlug")}
                  placeholder="acme-corp"
                />
                {errors.companySlug && (
                  <p className="text-sm text-destructive">{errors.companySlug.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Select value={plan} onValueChange={(value) => setValue("plan", value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="STARTER">Starter</SelectItem>
                    <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsers">Max Users</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  {...register("maxUsers", { valueAsNumber: true })}
                />
                {errors.maxUsers && (
                  <p className="text-sm text-destructive">{errors.maxUsers.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxQuizzes">Max Quizzes</Label>
                <Input
                  id="maxQuizzes"
                  type="number"
                  {...register("maxQuizzes", { valueAsNumber: true })}
                />
                {errors.maxQuizzes && (
                  <p className="text-sm text-destructive">{errors.maxQuizzes.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Owner User Details */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium">Owner User</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ownerFirstName">First Name</Label>
                <Input id="ownerFirstName" {...register("ownerFirstName")} />
                {errors.ownerFirstName && (
                  <p className="text-sm text-destructive">{errors.ownerFirstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerLastName">Last Name</Label>
                <Input id="ownerLastName" {...register("ownerLastName")} />
                {errors.ownerLastName && (
                  <p className="text-sm text-destructive">{errors.ownerLastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ownerEmail">Email</Label>
                <Input id="ownerEmail" type="email" {...register("ownerEmail")} />
                {errors.ownerEmail && (
                  <p className="text-sm text-destructive">{errors.ownerEmail.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerUsername">Username</Label>
                <Input id="ownerUsername" {...register("ownerUsername")} />
                {errors.ownerUsername && (
                  <p className="text-sm text-destructive">{errors.ownerUsername.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerPassword">Password</Label>
              <Input
                id="ownerPassword"
                type="password"
                {...register("ownerPassword")}
                placeholder="Min 8 characters"
              />
              {errors.ownerPassword && (
                <p className="text-sm text-destructive">{errors.ownerPassword.message}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Company"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
