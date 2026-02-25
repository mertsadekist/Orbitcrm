"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ContactQuestion } from "@/types/quiz";

interface ContactQuestionEditorProps {
  question: ContactQuestion;
  onChange: (q: ContactQuestion) => void;
}

export function ContactQuestionEditor({
  question,
  onChange,
}: ContactQuestionEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Question Text</Label>
        <Input
          type="text"
          value={question.questionText}
          onChange={(e) =>
            onChange({ ...question, questionText: e.target.value })
          }
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          type="text"
          value={question.description ?? ""}
          onChange={(e) =>
            onChange({ ...question, description: e.target.value || undefined })
          }
          placeholder="Optional description"
          autoComplete="off"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="required"
          checked={question.required}
          onCheckedChange={(checked) =>
            onChange({ ...question, required: checked })
          }
        />
        <Label htmlFor="required">Required</Label>
      </div>

      <div className="space-y-2">
        <Label>Weight</Label>
        <Input
          type="number"
          min={1}
          max={10}
          value={question.weight}
          onChange={(e) =>
            onChange({ ...question, weight: Number(e.target.value) })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>First Name Placeholder</Label>
        <Input
          type="text"
          value={question.firstNamePlaceholder ?? ""}
          onChange={(e) =>
            onChange({
              ...question,
              firstNamePlaceholder: e.target.value || undefined,
            })
          }
          placeholder="e.g., First name"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label>Last Name Placeholder</Label>
        <Input
          type="text"
          value={question.lastNamePlaceholder ?? ""}
          onChange={(e) =>
            onChange({
              ...question,
              lastNamePlaceholder: e.target.value || undefined,
            })
          }
          placeholder="e.g., Last name"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label>Email Placeholder</Label>
        <Input
          type="text"
          value={question.emailPlaceholder ?? ""}
          onChange={(e) =>
            onChange({
              ...question,
              emailPlaceholder: e.target.value || undefined,
            })
          }
          placeholder="e.g., you@company.com"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label>Phone Placeholder</Label>
        <Input
          type="text"
          value={question.phonePlaceholder ?? ""}
          onChange={(e) =>
            onChange({
              ...question,
              phonePlaceholder: e.target.value || undefined,
            })
          }
          placeholder="e.g., +1234567890"
          autoComplete="off"
        />
      </div>
    </div>
  );
}
