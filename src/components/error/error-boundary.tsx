"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  errorId?: string;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    fetch("/api/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        source: "CLIENT",
        url: typeof window !== "undefined" ? window.location.href : undefined,
        componentStack: errorInfo.componentStack,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.errorId) {
          this.setState({ errorId: data.errorId });
        }
      })
      .catch(() => {
        // Silently fail — error boundary shouldn't throw
      });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-2">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>An unexpected error occurred in this section.</p>
              {this.state.errorId && (
                <p className="font-mono text-xs">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </CardContent>
            <CardFooter className="justify-center">
              <Button
                onClick={() => this.setState({ hasError: false })}
                variant="outline"
              >
                Try Again
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
