import type {
  QuizQuestionType,
  QuizQuestion,
  QuizConfig,
  QuizOptionItem,
} from "@/types/quiz";

function generateId(): string {
  return crypto.randomUUID();
}

export function createDefaultOption(): QuizOptionItem {
  return {
    id: generateId(),
    label: "",
    value: "",
    score: 0,
  };
}

export function createDefaultQuestion(type: QuizQuestionType): QuizQuestion {
  const base = {
    id: generateId(),
    questionText: "",
    required: true,
    weight: 5,
  };

  switch (type) {
    case "text":
      return { ...base, type: "text", placeholder: "" };
    case "radio":
      return {
        ...base,
        type: "radio",
        options: [createDefaultOption(), createDefaultOption()],
        layout: "vertical" as const,
      };
    case "image_grid":
      return {
        ...base,
        type: "image_grid",
        options: [createDefaultOption(), createDefaultOption()],
        columns: 2 as const,
      };
    case "email":
      return { ...base, type: "email", placeholder: "you@company.com" };
    case "phone":
      return { ...base, type: "phone", placeholder: "+1234567890" };
    case "name":
      return {
        ...base,
        type: "name",
        firstNamePlaceholder: "First name",
        lastNamePlaceholder: "Last name",
      };
    case "contact":
      return {
        ...base,
        type: "contact",
        questionText: "Contact Information",
        firstNamePlaceholder: "First name",
        lastNamePlaceholder: "Last name",
        emailPlaceholder: "you@company.com",
        phonePlaceholder: "+1234567890",
      };
  }
}

export function createDefaultQuizConfig(): QuizConfig {
  return {
    version: 1,
    questions: [],
    settings: {
      showProgressBar: true,
      thankYouMessage:
        "Thank you for completing our quiz! We'll be in touch soon.",
      redirectUrl: null,
    },
    tracking: {},
    welcomeScreen: { enabled: false },
  };
}
