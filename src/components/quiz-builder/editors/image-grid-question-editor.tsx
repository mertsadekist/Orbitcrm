"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { OptionEditor } from "@/components/quiz-builder/option-editor";
import { createDefaultOption } from "@/lib/quiz/config-helpers";
import type { ImageGridQuestion, QuizOptionItem } from "@/types/quiz";

interface ImageGridQuestionEditorProps {
  question: ImageGridQuestion;
  onChange: (q: ImageGridQuestion) => void;
}

export function ImageGridQuestionEditor({
  question,
  onChange,
}: ImageGridQuestionEditorProps) {
  const handleOptionChange = (index: number, updated: QuizOptionItem) => {
    const newOptions = [...question.options];
    newOptions[index] = updated;
    onChange({ ...question, options: newOptions });
  };

  const handleOptionDelete = (index: number) => {
    const newOptions = question.options.filter((_, i) => i !== index);
    onChange({ ...question, options: newOptions });
  };

  const handleAddOption = () => {
    onChange({
      ...question,
      options: [...question.options, createDefaultOption()],
    });
  };

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
        <Label>Columns</Label>
        <Select
          value={String(question.columns ?? 2)}
          onValueChange={(v) =>
            onChange({ ...question, columns: Number(v) as 2 | 3 | 4 })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Options</Label>
        <div className="space-y-2">
          {question.options.map((option, index) => (
            <OptionEditor
              key={option.id}
              option={option}
              index={index}
              showImage={true}
              onChange={(updated) => handleOptionChange(index, updated)}
              onDelete={() => handleOptionDelete(index)}
            />
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleAddOption}>
          <Plus className="mr-2 h-4 w-4" />
          Add Option
        </Button>
      </div>
    </div>
  );
}
