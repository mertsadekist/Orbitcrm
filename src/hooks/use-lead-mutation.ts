"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateLeadStatus } from "@/actions/leads/update-lead-status";
import { assignLead } from "@/actions/leads/assign-lead";
import { createLead, type CreateLeadInput } from "@/actions/leads/create-lead";
import { updateLead, type UpdateLeadInput } from "@/actions/leads/update-lead";
import { addLeadNote } from "@/actions/leads/add-lead-note";
import { updateLeadNote } from "@/actions/leads/update-lead-note";
import { deleteLeadNote } from "@/actions/leads/delete-lead-note";
import { bulkAssignLeads } from "@/actions/leads/bulk-assign-leads";
import { bulkUpdateStatus } from "@/actions/leads/bulk-update-status";
import { importLeads } from "@/actions/leads/import-leads";
import type { ParsedLeadRow } from "@/lib/leads/excel-parser";
import type { LeadStatusValue } from "@/types/lead";

function useInvalidateLeads() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["leads"] });
    qc.invalidateQueries({ queryKey: ["lead"] });
  };
}

export function useUpdateLeadStatus() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: LeadStatusValue }) =>
      updateLeadStatus(leadId, status),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Status updated");
        invalidate();
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Failed to update status"),
  });
}

export function useAssignLead() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({ leadId, assignedToId }: { leadId: string; assignedToId: string | null }) =>
      assignLead(leadId, assignedToId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Lead assigned");
        invalidate();
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Failed to assign lead"),
  });
}

export function useCreateLead() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (input: CreateLeadInput) => createLead(input),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Lead created");
        invalidate();
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Failed to create lead"),
  });
}

export function useUpdateLead() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({ leadId, input }: { leadId: string; input: UpdateLeadInput }) =>
      updateLead(leadId, input),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Lead updated");
        invalidate();
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Failed to update lead"),
  });
}

export function useAddLeadNote() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({ leadId, content }: { leadId: string; content: string }) =>
      addLeadNote(leadId, content),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Note added");
        invalidate();
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Failed to add note"),
  });
}

export function useUpdateLeadNote() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({
      leadId,
      noteId,
      content,
    }: {
      leadId: string;
      noteId: string;
      content: string;
    }) => updateLeadNote(leadId, noteId, content),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Note updated");
        invalidate();
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Failed to update note"),
  });
}

export function useDeleteLeadNote() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({ leadId, noteId }: { leadId: string; noteId: string }) =>
      deleteLeadNote(leadId, noteId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Note deleted");
        invalidate();
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Failed to delete note"),
  });
}

export function useBulkAssign() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({ leadIds, assignedToId }: { leadIds: string[]; assignedToId: string | null }) =>
      bulkAssignLeads(leadIds, assignedToId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${result.data.updated} leads assigned`);
        invalidate();
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Failed to bulk assign"),
  });
}

export function useBulkUpdateStatus() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({ leadIds, status }: { leadIds: string[]; status: LeadStatusValue }) =>
      bulkUpdateStatus(leadIds, status),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${result.data.updated} leads updated`);
        invalidate();
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Failed to bulk update status"),
  });
}

export function useImportLeads() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (rows: ParsedLeadRow[]) => importLeads(rows),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          `Imported ${result.data.imported} lead${result.data.imported !== 1 ? "s" : ""}` +
            (result.data.skipped > 0 ? `, ${result.data.skipped} skipped` : "")
        );
        invalidate();
      } else {
        toast.error(result.error ?? "Import failed");
      }
    },
    onError: () => toast.error("Failed to import leads"),
  });
}
