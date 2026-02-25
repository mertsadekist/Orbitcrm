"use client";

import { Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WhatsAppButton } from "@/components/leads/whatsapp-button";
import { AssignLeadDropdown } from "@/components/leads/assign-lead-dropdown";
import { useUpdateLeadStatus } from "@/hooks/use-lead-mutation";
import { ALL_STATUSES, LEAD_STATUSES } from "@/lib/constants";
import type { FullLead, CompanyUser, LeadStatusValue } from "@/types/lead";

type LeadDetailsActionsProps = {
  lead: FullLead;
  companyUsers: CompanyUser[];
};

export function LeadDetailsActions({
  lead,
  companyUsers,
}: LeadDetailsActionsProps) {
  const updateStatus = useUpdateLeadStatus();

  const handleStatusChange = (value: string) => {
    updateStatus.mutate({
      leadId: lead.id,
      status: value as LeadStatusValue,
    });
  };

  return (
    <div className="space-y-3">
      {/* Quick-action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {lead.phone && (
          <WhatsAppButton
            phone={lead.phone}
            firstName={lead.firstName}
            companyName={lead.companyName}
            quizTitle={lead.quiz?.title}
            size="sm"
          />
        )}
        {lead.phone && (
          <Button variant="outline" size="sm" asChild>
            <a href={`tel:${lead.phone}`}>
              <Phone className="mr-1 h-4 w-4" />
              Call
            </a>
          </Button>
        )}
        {lead.email && (
          <Button variant="outline" size="sm" asChild>
            <a href={`mailto:${lead.email}`}>
              <Mail className="mr-1 h-4 w-4" />
              Email
            </a>
          </Button>
        )}
      </div>

      {/* Assign + Status */}
      <div className="flex items-center gap-2 flex-wrap">
        <AssignLeadDropdown
          leadId={lead.id}
          currentAssigneeId={lead.assignedToId}
          companyUsers={companyUsers}
        />

        <Select
          defaultValue={lead.status}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {ALL_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {LEAD_STATUSES[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
