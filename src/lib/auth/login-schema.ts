import { z } from "zod";

export const loginSchema = z.object({
  subscriptionId: z.string().min(1, "Subscription ID is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
