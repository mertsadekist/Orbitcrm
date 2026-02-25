"use client";

import { Mail, Phone, Building2 } from "lucide-react";
import type { FullLead } from "@/types/lead";

type LeadDetailsContactProps = {
  lead: FullLead;
};

export function LeadDetailsContact({ lead }: LeadDetailsContactProps) {
  return (
    <div className="grid gap-3">
      {/* Email */}
      <div className="flex items-center gap-3 text-sm">
        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
        {lead.email ? (
          <a
            href={`mailto:${lead.email}`}
            className="text-primary underline-offset-4 hover:underline truncate"
          >
            {lead.email}
          </a>
        ) : (
          <span className="text-muted-foreground">Not provided</span>
        )}
      </div>

      {/* Phone */}
      <div className="flex items-center gap-3 text-sm">
        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
        {lead.phone ? (
          <a
            href={`tel:${lead.phone}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            {lead.phone}
          </a>
        ) : (
          <span className="text-muted-foreground">Not provided</span>
        )}
      </div>

      {/* Company */}
      <div className="flex items-center gap-3 text-sm">
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        {lead.companyName ? (
          <span>{lead.companyName}</span>
        ) : (
          <span className="text-muted-foreground">Not provided</span>
        )}
      </div>
    </div>
  );
}
