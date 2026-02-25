"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { LeadScoreBadge } from "@/components/leads/lead-score-badge";
import { formatRelativeTime } from "@/lib/lead-utils";
import type { FullLead } from "@/types/lead";

type LeadDetailsHeaderProps = {
  lead: FullLead;
};

export function LeadDetailsHeader({ lead }: LeadDetailsHeaderProps) {
  const firstName = lead.firstName ?? "";
  const lastName = lead.lastName ?? "";
  const fullName =
    firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : "Unnamed Lead";
  const initials =
    firstName || lastName
      ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
      : "??";

  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-12 w-12">
        <AvatarFallback className="text-sm font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1.5">
        <h2 className="text-lg font-semibold leading-tight">{fullName}</h2>

        <div className="flex items-center gap-2">
          <LeadStatusBadge status={lead.status} />
          <LeadScoreBadge score={lead.score} />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="text-xs font-normal">
            {lead.source}
          </Badge>
          <span>&middot;</span>
          <span>{formatRelativeTime(lead.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
