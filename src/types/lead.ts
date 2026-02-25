import type { LeadStatus } from "@/generated/prisma/client";

// ─── Status Type ────────────────────────────────────────

export type LeadStatusValue = `${LeadStatus}`;

// ─── Company User (for dropdowns) ───────────────────────

export type CompanyUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

// ─── Lead Note ──────────────────────────────────────────

export type LeadNote = {
  id: string;
  content: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  updatedAt?: string;
  updatedBy?: {
    id: string;
    name: string;
  };
};

// ─── Serialized Lead (RSC → Client) ────────────────────

export type SerializedLead = {
  id: string;
  companyId: string;
  quizId: string | null;
  assignedToId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  source: string;
  status: LeadStatusValue;
  score: number | null;
  notes: LeadNote[] | null;
  tags: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: CompanyUser | null;
  quiz: { id: string; title: string } | null;
};

// ─── Full Lead (Details Sheet) ──────────────────────────

export type FullLead = SerializedLead & {
  quizResponses: unknown;
  deals: Array<{
    id: string;
    title: string;
    value: string;
    stage: string;
    createdAt: string;
  }>;
};

// ─── Filters ────────────────────────────────────────────

export type LeadFilters = {
  assignee?: string;
  source?: string;
  scoreMin?: number;
  scoreMax?: number;
  dateFrom?: string;
  dateTo?: string;
};
