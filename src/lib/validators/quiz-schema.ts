import { z } from "zod";

// ─── Option Schema ──────────────────────────────────────

const optionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, "Option label is required"),
  value: z.string().min(1, "Option value is required"),
  score: z.number().int().min(0).max(10),
  icon: z.string().optional(),
  imageUrl: z.string().optional(),
});

// ─── Question Schemas (discriminated union on "type") ───

const baseFields = {
  id: z.string().min(1),
  questionText: z.string().min(1, "Question text is required"),
  description: z.string().optional(),
  required: z.boolean(),
  weight: z.number().int().min(1).max(10),
  group: z.string().optional(),
};

const textQuestionSchema = z.object({
  ...baseFields,
  type: z.literal("text"),
  placeholder: z.string().optional(),
  maxLength: z.number().int().positive().optional(),
  multiline: z.boolean().optional(),
});

const radioQuestionSchema = z.object({
  ...baseFields,
  type: z.literal("radio"),
  options: z.array(optionSchema).min(2, "At least 2 options required"),
  layout: z.enum(["vertical", "horizontal", "cards"]).optional(),
});

const imageGridQuestionSchema = z.object({
  ...baseFields,
  type: z.literal("image_grid"),
  options: z.array(optionSchema).min(2, "At least 2 options required"),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
});

const emailQuestionSchema = z.object({
  ...baseFields,
  type: z.literal("email"),
  placeholder: z.string().optional(),
});

const phoneQuestionSchema = z.object({
  ...baseFields,
  type: z.literal("phone"),
  placeholder: z.string().optional(),
  countryCode: z.string().optional(),
});

const nameQuestionSchema = z.object({
  ...baseFields,
  type: z.literal("name"),
  firstNamePlaceholder: z.string().optional(),
  lastNamePlaceholder: z.string().optional(),
});

const contactQuestionSchema = z.object({
  ...baseFields,
  type: z.literal("contact"),
  firstNamePlaceholder: z.string().optional(),
  lastNamePlaceholder: z.string().optional(),
  emailPlaceholder: z.string().optional(),
  phonePlaceholder: z.string().optional(),
  countryCode: z.string().optional(),
});

const questionSchema = z.discriminatedUnion("type", [
  textQuestionSchema,
  radioQuestionSchema,
  imageGridQuestionSchema,
  emailQuestionSchema,
  phoneQuestionSchema,
  nameQuestionSchema,
  contactQuestionSchema,
]);

// ─── Config Schema ──────────────────────────────────────

export const quizConfigSchema = z.object({
  version: z.literal(1),
  questions: z.array(questionSchema),
  settings: z.object({
    showProgressBar: z.boolean(),
    thankYouMessage: z.string().min(1, "Thank you message is required"),
    redirectUrl: z.string().url().nullable(),
  }),
  tracking: z
    .object({
      facebookPixelId: z.string().optional(),
      tiktokPixelId: z.string().optional(),
    })
    .passthrough(),
  welcomeScreen: z.object({
    enabled: z.boolean(),
    title: z.string().optional(),
    description: z.string().optional(),
    buttonText: z.string().optional(),
  }),
});

// ─── Submission Schema ──────────────────────────────────

export const quizSubmissionSchema = z.object({
  quizId: z.string().min(1),
  responses: z.array(
    z.object({
      questionId: z.string().min(1),
      questionText: z.string(),
      questionType: z.enum([
        "text",
        "radio",
        "image_grid",
        "email",
        "phone",
        "name",
        "contact",
      ]),
      answer: z.unknown(),
      selectedOptionId: z.string().optional(),
    })
  ),
  startedAt: z.string(),
  completedAt: z.string(),
});

export type ValidatedQuizConfig = z.infer<typeof quizConfigSchema>;
