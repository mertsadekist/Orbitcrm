"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface QuizNavigationProps {
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
}

export function QuizNavigation({
  onBack,
  onNext,
  canGoBack,
  canGoNext,
  isLastStep,
  isSubmitting,
}: QuizNavigationProps) {
  return (
    <div className="flex flex-row justify-between gap-3">
      {canGoBack ? (
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft />
          Back
        </Button>
      ) : (
        <div />
      )}

      <Button
        onClick={onNext}
        disabled={!canGoNext || isSubmitting}
      >
        {isLastStep ? (
          isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit"
          )
        ) : (
          <>
            Next
            <ChevronRight />
          </>
        )}
      </Button>
    </div>
  );
}
