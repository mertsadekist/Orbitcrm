"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

interface QuizThankYouScreenProps {
  message: string;
  redirectUrl: string | null;
}

export function QuizThankYouScreen({
  message,
  redirectUrl,
}: QuizThankYouScreenProps) {
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!redirectUrl) return;

    setRedirecting(true);
    const timeout = setTimeout(() => {
      window.location.href = redirectUrl;
    }, 3000);

    return () => clearTimeout(timeout);
  }, [redirectUrl]);

  return (
    <div className="flex items-center justify-center animate-in fade-in duration-500">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <CheckCircle className="size-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Thank You!</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-muted-foreground">{message}</p>
          {redirecting && (
            <p className="text-sm text-muted-foreground">Redirecting...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
