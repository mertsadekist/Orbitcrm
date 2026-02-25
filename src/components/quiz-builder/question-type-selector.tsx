"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Type, CircleDot, Image, Mail, Phone, User, UserCircle } from "lucide-react";
import type { QuizQuestionType } from "@/types/quiz";

interface QuestionTypeSelectorProps {
  onSelect: (type: QuizQuestionType) => void;
}

const questionTypes: {
  value: QuizQuestionType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "text", label: "Text", icon: <Type className="h-4 w-4" /> },
  { value: "radio", label: "Radio", icon: <CircleDot className="h-4 w-4" /> },
  {
    value: "image_grid",
    label: "Image Grid",
    icon: <Image className="h-4 w-4" />,
  },
  { value: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
  { value: "phone", label: "Phone", icon: <Phone className="h-4 w-4" /> },
  { value: "name", label: "Name", icon: <User className="h-4 w-4" /> },
  { value: "contact", label: "Contact Form", icon: <UserCircle className="h-4 w-4" /> },
];

export function QuestionTypeSelector({ onSelect }: QuestionTypeSelectorProps) {
  const [value, setValue] = useState("");

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        onSelect(v as QuizQuestionType);
        setValue("");
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Add question..." />
      </SelectTrigger>
      <SelectContent>
        {questionTypes.map((qt) => (
          <SelectItem key={qt.value} value={qt.value}>
            <span className="flex items-center gap-2">
              {qt.icon}
              {qt.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
