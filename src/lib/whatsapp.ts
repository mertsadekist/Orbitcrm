export function sanitizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildWhatsAppUrl({
  phone,
  firstName,
  companyName,
  quizTitle,
}: {
  phone: string;
  firstName?: string | null;
  companyName?: string | null;
  quizTitle?: string | null;
}): string {
  const sanitized = sanitizePhoneForWhatsApp(phone);
  const name = firstName ?? "there";
  const quiz = quizTitle ?? "our assessment";

  let text = `Hi ${name}, thanks for completing ${quiz}!`;
  if (companyName) {
    text += ` We're ${companyName} and we'd love to help you further.`;
  }

  return `https://wa.me/${sanitized}?text=${encodeURIComponent(text)}`;
}
