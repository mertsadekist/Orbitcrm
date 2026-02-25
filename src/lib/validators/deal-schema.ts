import { z } from "zod";

export const commissionSplitSchema = z.object({
  userId: z.string().min(1),
  label: z.string().min(1),
  percentage: z.number().min(0.01).max(100),
});

export const closeDealSchema = z
  .object({
    leadId: z.string().min(1),
    title: z.string().min(1).max(200),
    value: z.number().positive().max(9_999_999_999.99),
    currency: z.string().min(1).max(10).default("USD"),
    splits: z.array(commissionSplitSchema),
  })
  .refine(
    (data) => {
      const total = data.splits.reduce((sum, s) => sum + s.percentage, 0);
      return total <= 100;
    },
    { message: "Total commission splits cannot exceed 100%", path: ["splits"] }
  );

export const updateDealStageSchema = z.object({
  dealId: z.string().min(1),
  newStage: z.enum([
    "PROSPECTING",
    "QUALIFICATION",
    "PROPOSAL",
    "NEGOTIATION",
    "CLOSED_WON",
    "CLOSED_LOST",
  ]),
});

export const approveCommissionSchema = z.object({
  commissionId: z.string().min(1),
});

export type CloseDealInput = z.infer<typeof closeDealSchema>;
