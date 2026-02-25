"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Type,
  CircleDot,
  Image,
  Mail,
  Phone,
  User,
  UserCircle,
  ChevronUp,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion, QuizQuestionType } from "@/types/quiz";

interface QuestionListItemProps {
  question: QuizQuestion;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const typeIcons: Record<QuizQuestionType, React.ReactNode> = {
  text: <Type className="h-4 w-4 shrink-0" />,
  radio: <CircleDot className="h-4 w-4 shrink-0" />,
  image_grid: <Image className="h-4 w-4 shrink-0" />,
  email: <Mail className="h-4 w-4 shrink-0" />,
  phone: <Phone className="h-4 w-4 shrink-0" />,
  name: <User className="h-4 w-4 shrink-0" />,
  contact: <UserCircle className="h-4 w-4 shrink-0" />,
};

export function QuestionListItem({
  question,
  index,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
  isFirst,
  isLast,
}: QuestionListItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1.5 cursor-pointer overflow-hidden",
          isSelected && "bg-accent border-l-2 border-primary"
        )}
        onClick={onSelect}
      >
        {typeIcons[question.type]}
        <Badge variant="secondary" className="shrink-0 text-xs w-6 h-5 flex items-center justify-center">
          {index + 1}
        </Badge>
        <span className="truncate text-sm min-w-0 max-w-[100px]">
          {question.questionText || "Untitled"}
        </span>
        <div className="flex items-center gap-0.5 shrink-0 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            disabled={isFirst}
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            disabled={isLast}
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
