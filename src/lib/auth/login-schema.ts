import { z } from "zod";

export const loginSchema = z.object({
  subscriptionId: z.string().regex(/^\d{6}$/, "Subscription ID must be exactly 6 digits"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
