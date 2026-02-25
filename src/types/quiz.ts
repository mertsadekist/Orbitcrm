// ─── Question Types ─────────────────────────────────────

export type QuizQuestionType =
  | "text"
  | "radio"
  | "image_grid"
  | "email"
  | "phone"
  | "name"
  | "contact";

export interface QuizOptionItem {
  id: string;
  label: string;
  value: string;
  score: number;
  icon?: string; // Emoji or icon name for radio options
  imageUrl?: string; // Full image URL for image_grid options
}

// ─── Base Question ──────────────────────────────────────

interface BaseQuestion {
  id: string;
  type: QuizQuestionType;
  questionText: string;
  description?: string;
  required: boolean;
  weight: number; // 1-10
  group?: string;
}

// ─── Typed Questions ────────────────────────────────────

export interface TextQuestion extends BaseQuestion {
  type: "text";
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
}

export interface RadioQuestion extends BaseQuestion {
  type: "radio";
  options: QuizOptionItem[];
  layout?: "vertical" | "horizontal" | "cards";
}

export interface ImageGridQuestion extends BaseQuestion {
  type: "image_grid";
  options: QuizOptionItem[];
  columns?: 2 | 3 | 4;
}

export interface EmailQuestion extends BaseQuestion {
  type: "email";
  placeholder?: string;
}

export interface PhoneQuestion extends BaseQuestion {
  type: "phone";
  placeholder?: string;
  countryCode?: string;
}

export interface NameQuestion extends BaseQuestion {
  type: "name";
  firstNamePlaceholder?: string;
  lastNamePlaceholder?: string;
}

export interface ContactQuestion extends BaseQuestion {
  type: "contact";
  firstNamePlaceholder?: string;
  lastNamePlaceholder?: string;
  emailPlaceholder?: string;
  phonePlaceholder?: string;
  countryCode?: string;
}

export type QuizQuestion =
  | TextQuestion
  | RadioQuestion
  | ImageGridQuestion
  | EmailQuestion
  | PhoneQuestion
  | NameQuestion
  | ContactQuestion;

// ─── Quiz Config ────────────────────────────────────────

export interface QuizSettings {
  showProgressBar: boolean;
  thankYouMessage: string;
  redirectUrl: string | null;
}

export interface QuizTracking {
  facebookPixelId?: string;
  tiktokPixelId?: string;
}

export interface QuizWelcomeScreen {
  enabled: boolean;
  title?: string;
  description?: string;
  buttonText?: string;
}

export interface QuizConfig {
  version: 1;
  questions: QuizQuestion[];
  settings: QuizSettings;
  tracking: QuizTracking;
  welcomeScreen: QuizWelcomeScreen;
}

// ─── Submission Types ───────────────────────────────────

export interface QuizResponse {
  questionId: string;
  questionText: string;
  questionType: QuizQuestionType;
  answer: unknown;
  selectedOptionId?: string;
}

export interface QuizSubmissionData {
  quizId: string;
  responses: QuizResponse[];
  startedAt: string;
  completedAt: string;
}

export interface ExtractedContactInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

// ─── UI State Types ─────────────────────────────────────

export type QuizPhase =
  | "welcome"
  | "questions"
  | "summary"
  | "submitting"
  | "thankyou";

export type QuizDirection = "forward" | "backward";
