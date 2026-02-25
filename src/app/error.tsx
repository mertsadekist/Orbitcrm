"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    fetch("/api/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        url: window.location.href,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>An unexpected error occurred. Please try again.</p>
          {error.digest && (
            <p className="font-mono text-xs">Digest: {error.digest}</p>
          )}
        </CardContent>
        <CardFooter className="justify-center gap-3">
          <Button onClick={reset} variant="outline">
            Try Again
          </Button>
          <Button onClick={() => (window.location.href = "/dashboard")}>
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
