"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { IconPicker } from "@/components/quiz-builder/icon-picker";
import type { QuizOptionItem } from "@/types/quiz";

interface OptionEditorProps {
  option: QuizOptionItem;
  index: number;
  showImage: boolean;
  showIcon?: boolean;
  onChange: (updated: QuizOptionItem) => void;
  onDelete: () => void;
}

export function OptionEditor({
  option,
  index,
  showImage,
  showIcon = false,
  onChange,
  onDelete,
}: OptionEditorProps) {
  return (
    <div className="flex flex-row items-center gap-2">
      <Input
        placeholder={`Label ${index + 1}`}
        value={option.label}
        onChange={(e) => onChange({ ...option, label: e.target.value })}
      />
      <Input
        placeholder="Value"
        value={option.value}
        onChange={(e) => onChange({ ...option, value: e.target.value })}
      />
      {showIcon && (
        <IconPicker
          value={option.icon}
          onChange={(icon) => onChange({ ...option, icon })}
        />
      )}
      <Input
        type="number"
        min={0}
        max={10}
        className="w-24"
        placeholder="Score"
        value={option.score}
        onChange={(e) =>
          onChange({ ...option, score: Number(e.target.value) })
        }
      />
      {showImage && (
        <Input
          placeholder="Image URL"
          value={option.imageUrl ?? ""}
          onChange={(e) =>
            onChange({ ...option, imageUrl: e.target.value || undefined })
          }
        />
      )}
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
