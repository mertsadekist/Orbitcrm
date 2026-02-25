"use client";

import { useState, useMemo, useCallback } from "react";
import type {
  QuizConfig,
  QuizQuestion,
  QuizResponse,
  QuizPhase,
  QuizDirection,
  QuizSubmissionData,
} from "@/types/quiz";

export function useQuizState(config: QuizConfig) {
  const [phase, setPhase] = useState<QuizPhase>(
    config.welcomeScreen.enabled ? "welcome" : "questions"
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<QuizDirection>("forward");
  const [responses, setResponses] = useState<Map<string, QuizResponse>>(
    new Map()
  );
  const [validationErrors, setValidationErrors] = useState<
    Map<string, string>
  >(new Map());

  // Group questions into steps
  const steps = useMemo(() => {
    const grouped: QuizQuestion[][] = [];
    const groupMap = new Map<string, QuizQuestion[]>();

    for (const q of config.questions) {
      if (q.group) {
        if (!groupMap.has(q.group)) {
          const arr: QuizQuestion[] = [];
          groupMap.set(q.group, arr);
          grouped.push(arr);
        }
        groupMap.get(q.group)!.push(q);
      } else {
        grouped.push([q]);
      }
    }

    return grouped;
  }, [config.questions]);

  const totalSteps = steps.length;
  const currentQuestions = steps[currentStep] ?? [];
  const progress =
    totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const isLastStep = currentStep >= totalSteps - 1;

  const canGoNext = useMemo(() => {
    for (const q of currentQuestions) {
      if (!q.required) continue;
      const r = responses.get(q.id);
      if (!r || !hasAnswer(r.answer)) return false;
    }
    return true;
  }, [currentQuestions, responses]);

  const setResponse = useCallback(
    (questionId: string, response: QuizResponse) => {
      setResponses((prev) => {
        const next = new Map(prev);
        next.set(questionId, response);
        return next;
      });
      setValidationErrors((prev) => {
        if (!prev.has(questionId)) return prev;
        const next = new Map(prev);
        next.delete(questionId);
        return next;
      });
    },
    []
  );

  const goNext = useCallback(() => {
    // Validate current step
    const errors = new Map<string, string>();
    for (const q of currentQuestions) {
      if (q.required) {
        const r = responses.get(q.id);
        if (!r || !hasAnswer(r.answer)) {
          errors.set(q.id, "This question is required");
        }
      }
    }

    if (errors.size > 0) {
      setValidationErrors(errors);
      return;
    }

    setDirection("forward");

    if (isLastStep) {
      setPhase("summary");
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [currentQuestions, responses, isLastStep]);

  const goBack = useCallback(() => {
    setDirection("backward");
    if (phase === "summary") {
      setPhase("questions");
    } else if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [phase, currentStep]);

  const startQuiz = useCallback(() => {
    setPhase("questions");
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    setPhase("questions");
    setCurrentStep(stepIndex);
    setDirection("backward");
  }, []);

  const getSubmissionData = useCallback(
    (quizId: string): QuizSubmissionData => {
      return {
        quizId,
        responses: Array.from(responses.values()),
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
    },
    [responses]
  );

  return {
    phase,
    setPhase,
    currentStep,
    direction,
    steps,
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
  };
}

function hasAnswer(answer: unknown): boolean {
  if (answer == null) return false;
  if (typeof answer === "string") return answer.trim().length > 0;
  if (typeof answer === "object") {
    return Object.values(answer as Record<string, unknown>).some(
      (v) => typeof v === "string" && v.trim().length > 0
    );
  }
  return true;
}
