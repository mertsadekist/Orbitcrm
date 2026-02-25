"use client";

import { useState, useEffect } from "react";
import type {
  QuizQuestion,
  QuizResponse,
  QuizDirection,
  TextQuestion,
  RadioQuestion,
  ImageGridQuestion,
  EmailQuestion,
  PhoneQuestion,
  NameQuestion,
  ContactQuestion,
} from "@/types/quiz";
import { TextRenderer } from "./renderers/text-renderer";
import { RadioRenderer } from "./renderers/radio-renderer";
import { ImageGridRenderer } from "./renderers/image-grid-renderer";
import { EmailRenderer } from "./renderers/email-renderer";
import { PhoneRenderer } from "./renderers/phone-renderer";
import { NameRenderer } from "./renderers/name-renderer";
import { ContactRenderer } from "./renderers/contact-renderer";

interface QuestionStepProps {
  questions: QuizQuestion[];
  responses: Map<string, QuizResponse>;
  validationErrors: Map<string, string>;
  onSetResponse: (questionId: string, response: QuizResponse) => void;
  direction: QuizDirection;
}

export function QuestionStep({
  questions,
  responses,
  validationErrors,
  onSetResponse,
  direction,
}: QuestionStepProps) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setEntered(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setEntered(true);
      });
    });
  }, [questions]);

  const initialOffset =
    direction === "forward" ? "translate-x-[30px]" : "translate-x-[-30px]";

  return (
    <div
      key={questions[0]?.id ?? "empty"}
      className={`transition-all duration-300 ease-out ${
        entered
          ? "opacity-100 translate-x-0"
          : `opacity-0 ${initialOffset}`
      }`}
    >
      <div className="space-y-6">
        {questions.map((question) => {
          const response = responses.get(question.id);
          const error = validationErrors.get(question.id);

          return (
            <div key={question.id} className="space-y-2">
              <div>
                <p className="text-base font-medium">
                  {question.questionText}
                  {question.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </p>
                {question.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {question.description}
                  </p>
                )}
              </div>

              {renderQuestion(question, response, error, onSetResponse)}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderQuestion(
  question: QuizQuestion,
  response: QuizResponse | undefined,
  error: string | undefined,
  onRespond: (questionId: string, response: QuizResponse) => void
) {
  const handleRespond = (resp: QuizResponse) => {
    onRespond(question.id, resp);
  };

  switch (question.type) {
    case "text":
      return (
        <TextRenderer
          question={question as TextQuestion}
          response={response}
          error={error}
          onRespond={handleRespond}
        />
      );
    case "radio":
      return (
        <RadioRenderer
          question={question as RadioQuestion}
          response={response}
          error={error}
          onRespond={handleRespond}
        />
      );
    case "image_grid":
      return (
        <ImageGridRenderer
          question={question as ImageGridQuestion}
          response={response}
          error={error}
          onRespond={handleRespond}
        />
      );
    case "email":
      return (
        <EmailRenderer
          question={question as EmailQuestion}
          response={response}
          error={error}
          onRespond={handleRespond}
        />
      );
    case "phone":
      return (
        <PhoneRenderer
          question={question as PhoneQuestion}
          response={response}
          error={error}
          onRespond={handleRespond}
        />
      );
    case "name":
      return (
        <NameRenderer
          question={question as NameQuestion}
          response={response}
          error={error}
          onRespond={handleRespond}
        />
      );
    case "contact":
      return (
        <ContactRenderer
          question={question as ContactQuestion}
          response={response}
          error={error}
          onRespond={handleRespond}
        />
      );
    default:
      return null;
  }
}
