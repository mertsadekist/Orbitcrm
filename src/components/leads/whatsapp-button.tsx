"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type WhatsAppButtonProps = {
  phone: string;
  firstName?: string | null;
  companyName?: string | null;
  quizTitle?: string | null;
  size?: "default" | "sm" | "icon";
};

export function WhatsAppButton({
  phone,
  firstName,
  companyName,
  quizTitle,
  size = "sm",
}: WhatsAppButtonProps) {
  const url = buildWhatsAppUrl({ phone, firstName, companyName, quizTitle });

  return (
    <Button
      variant="outline"
      size={size}
      className="text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950"
      asChild
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-4 w-4" />
        {size !== "icon" && <span className="ml-1">WhatsApp</span>}
      </a>
    </Button>
  );
}
