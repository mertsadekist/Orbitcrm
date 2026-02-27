"use client";

import { Badge } from "@/components/ui/badge";
import { FileQuestion, UserPlus, Upload, Globe, Users, Share2, Phone } from "lucide-react";

const sourceConfig: Record<string, { label: string; icon: typeof FileQuestion }> = {
  quiz:      { label: "Quiz",      icon: FileQuestion },
  manual:    { label: "Manual",    icon: UserPlus },
  import:    { label: "Import",    icon: Upload },
  website:   { label: "Website",   icon: Globe },
  referral:  { label: "Referral",  icon: Users },
  social:    { label: "Social",    icon: Share2 },
  cold_call: { label: "Cold Call", icon: Phone },
};

export function LeadSourceBadge({ source }: { source: string }) {
  const config = sourceConfig[source] ?? { label: source, icon: UserPlus };
  const Icon = config.icon;

  return (
    <Badge variant="outline" className="gap-1 font-normal">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
