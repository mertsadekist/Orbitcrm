"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateLead } from "@/hooks/use-lead-mutation";
import type { FullLead } from "@/types/lead";

type LeadTabDetailsProps = {
  lead: FullLead;
};

export function LeadTabDetails({ lead }: LeadTabDetailsProps) {
  const updateLead = useUpdateLead();

  const [firstName, setFirstName] = useState(lead.firstName ?? "");
  const [lastName, setLastName] = useState(lead.lastName ?? "");
  const [email, setEmail] = useState(lead.email ?? "");
  const [phone, setPhone] = useState(lead.phone ?? "");
  const [companyName, setCompanyName] = useState(lead.companyName ?? "");
  const [tags, setTags] = useState(lead.tags ?? "");

  // Sync local state when lead data changes (e.g. after refetch)
  useEffect(() => {
    setFirstName(lead.firstName ?? "");
    setLastName(lead.lastName ?? "");
    setEmail(lead.email ?? "");
    setPhone(lead.phone ?? "");
    setCompanyName(lead.companyName ?? "");
    setTags(lead.tags ?? "");
  }, [lead]);

  const isDirty =
    firstName !== (lead.firstName ?? "") ||
    lastName !== (lead.lastName ?? "") ||
    email !== (lead.email ?? "") ||
    phone !== (lead.phone ?? "") ||
    companyName !== (lead.companyName ?? "") ||
    tags !== (lead.tags ?? "");

  const handleSave = () => {
    updateLead.mutate({
      leadId: lead.id,
      input: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        companyName: companyName || undefined,
        tags: tags || undefined,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="detail-firstName">First Name</Label>
          <Input
            id="detail-firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="detail-lastName">Last Name</Label>
          <Input
            id="detail-lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="detail-email">Email</Label>
        <Input
          id="detail-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="detail-phone">Phone</Label>
        <Input
          id="detail-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 234 567 8900"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="detail-companyName">Company</Label>
        <Input
          id="detail-companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="detail-source">Source</Label>
        <Input
          id="detail-source"
          value={lead.source}
          readOnly
          disabled
          className="bg-muted"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="detail-tags">Tags</Label>
        <Input
          id="detail-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Comma-separated tags"
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={!isDirty || updateLead.isPending}
        className="w-full"
      >
        {updateLead.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
