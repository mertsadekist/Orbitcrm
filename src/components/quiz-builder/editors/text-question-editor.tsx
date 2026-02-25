"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { TextQuestion } from "@/types/quiz";

interface TextQuestionEditorProps {
  question: TextQuestion;
  onChange: (q: TextQuestion) => void;
}

export function TextQuestionEditor({
  question,
  onChange,
}: TextQuestionEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Question Text</Label>
        <Input
          value={question.questionText}
          onChange={(e) =>
            onChange({ ...question, questionText: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={question.description ?? ""}
          onChange={(e) =>
            onChange({ ...question, description: e.target.value || undefined })
          }
          placeholder="Optional description"
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
        <Label>Placeholder</Label>
        <Input
          value={question.placeholder ?? ""}
          onChange={(e) =>
            onChange({ ...question, placeholder: e.target.value || undefined })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Max Length</Label>
        <Input
          type="number"
          value={question.maxLength ?? ""}
          onChange={(e) =>
            onChange({
              ...question,
              maxLength: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="multiline"
          checked={question.multiline ?? false}
          onCheckedChange={(checked) =>
            onChange({ ...question, multiline: checked })
          }
        />
        <Label htmlFor="multiline">Multiline</Label>
      </div>
    </div>
  );
}
