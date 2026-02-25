"use client";

import { TextQuestionEditor } from "@/components/quiz-builder/editors/text-question-editor";
import { RadioQuestionEditor } from "@/components/quiz-builder/editors/radio-question-editor";
import { ImageGridQuestionEditor } from "@/components/quiz-builder/editors/image-grid-question-editor";
import { EmailQuestionEditor } from "@/components/quiz-builder/editors/email-question-editor";
import { PhoneQuestionEditor } from "@/components/quiz-builder/editors/phone-question-editor";
import { NameQuestionEditor } from "@/components/quiz-builder/editors/name-question-editor";
import { ContactQuestionEditor } from "@/components/quiz-builder/editors/contact-question-editor";
import type {
  QuizQuestion,
  TextQuestion,
  RadioQuestion,
  ImageGridQuestion,
  EmailQuestion,
  PhoneQuestion,
  NameQuestion,
  ContactQuestion,
} from "@/types/quiz";

interface QuestionEditorProps {
  question: QuizQuestion;
  onChange: (q: QuizQuestion) => void;
}

export function QuestionEditor({ question, onChange }: QuestionEditorProps) {
  switch (question.type) {
    case "text":
      return (
        <TextQuestionEditor
          question={question as TextQuestion}
          onChange={onChange}
        />
      );
    case "radio":
      return (
        <RadioQuestionEditor
          question={question as RadioQuestion}
          onChange={onChange}
        />
      );
    case "image_grid":
      return (
        <ImageGridQuestionEditor
          question={question as ImageGridQuestion}
          onChange={onChange}
        />
      );
    case "email":
      return (
        <EmailQuestionEditor
          question={question as EmailQuestion}
          onChange={onChange}
        />
      );
    case "phone":
      return (
        <PhoneQuestionEditor
          question={question as PhoneQuestion}
          onChange={onChange}
        />
      );
    case "name":
      return (
        <NameQuestionEditor
          question={question as NameQuestion}
          onChange={onChange}
        />
      );
    case "contact":
      return (
        <ContactQuestionEditor
          question={question as ContactQuestion}
          onChange={onChange}
        />
      );
    default:
      return <div>Unknown question type</div>;
  }
}
