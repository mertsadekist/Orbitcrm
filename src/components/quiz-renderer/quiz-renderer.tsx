"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useQuizState } from "./use-quiz-state";
import { QuizProgressBar } from "./quiz-progress-bar";
import { QuizNavigation } from "./quiz-navigation";
import { QuizWelcomeScreen } from "./quiz-welcome-screen";
import { QuizThankYouScreen } from "./quiz-thank-you-screen";
import { QuizSummaryStep } from "./quiz-summary-step";
import { QuestionStep } from "./question-step";
import { submitQuiz } from "@/actions/quiz/submit-quiz";
import { usePixel } from "@/components/tracking/pixel-provider";
import type { QuizConfig } from "@/types/quiz";

type QuizRendererProps = {
  quizId: string;
  config: QuizConfig;
  primaryColor: string;
  backgroundImage?: string | null;
};

export function QuizRenderer({
  quizId,
  config,
  primaryColor,
  backgroundImage,
}: QuizRendererProps) {
  const {
    phase,
    setPhase,
    currentStep,
    direction,
    totalSteps,
    currentQuestions,
    progress,
    isLastStep,
    canGoNext,
    responses,
    validationErrors,
    setResponse,
    goNext,
    goBack,
    startQuiz,
    goToStep,
    getSubmissionData,
  } = useQuizState(config);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const pixel = usePixelSafe();

  async function handleSubmit() {
    setIsSubmitting(true);
    setPhase("submitting");

    const data = getSubmissionData(quizId);
    const result = await submitQuiz(data);

    if (result.success) {
      pixel?.fireCompleteRegistration();
      setPhase("thankyou");
    } else {
      toast.error(result.error);
      setPhase("summary");
    }

    setIsSubmitting(false);
  }

  const bgStyle: React.CSSProperties = {
    ["--quiz-primary" as string]: primaryColor,
    ...(backgroundImage
      ? {
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {}),
  };

  return (
    <div className="flex justify-center px-4" style={bgStyle}>
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6 sm:p-8">
          {phase === "welcome" && (
            <QuizWelcomeScreen
              welcomeScreen={config.welcomeScreen}
              onStart={startQuiz}
            />
          )}

          {phase === "questions" && (
            <div className="space-y-6">
              <QuizProgressBar
                progress={progress}
                show={config.settings.showProgressBar}
              />

              <QuestionStep
                key={currentStep}
                questions={currentQuestions}
                responses={responses}
                validationErrors={validationErrors}
                onSetResponse={setResponse}
                direction={direction}
              />

              <QuizNavigation
                onBack={goBack}
                onNext={goNext}
                canGoBack={currentStep > 0}
                canGoNext={canGoNext}
                isLastStep={isLastStep}
                isSubmitting={false}
              />

              <p className="text-center text-xs text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
              </p>
            </div>
          )}

          {phase === "summary" && (
            <div className="space-y-6">
              <QuizSummaryStep
                questions={config.questions}
                responses={responses}
                onEdit={goToStep}
              />
              <div className="flex justify-end gap-3">
                <button
                  className="text-sm text-muted-foreground underline"
                  onClick={goBack}
                >
                  Go back
                </button>
                <button
                  className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: primaryColor }}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit
                </button>
              </div>
            </div>
          )}

          {phase === "submitting" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Submitting your responses...
              </p>
            </div>
          )}

          {phase === "thankyou" && (
            <QuizThankYouScreen
              message={config.settings.thankYouMessage}
              redirectUrl={config.settings.redirectUrl}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Safe wrapper for usePixel — works even outside PixelProvider (e.g., preview)
function usePixelSafe() {
  try {
    return usePixel();
  } catch {
    return null;
  }
}
