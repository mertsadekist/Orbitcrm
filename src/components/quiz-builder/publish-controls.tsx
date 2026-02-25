"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Loader2,
  Globe,
  GlobeIcon as GlobeOff,
  Eye,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

interface PublishControlsProps {
  quizId: string;
  isPublished: boolean;
  companySlug: string;
  quizSlug: string;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onTogglePublish: () => void;
}

export function PublishControls({
  quizId,
  isPublished,
  companySlug,
  quizSlug,
  isSaving,
  hasUnsavedChanges,
  onSave,
  onTogglePublish,
}: PublishControlsProps) {
  const handleCopyLink = async () => {
    const url = `${window.location.origin}/q/${companySlug}/${quizSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="flex flex-row items-center gap-2">
      <Badge variant={isPublished ? "default" : "secondary"}>
        {isPublished ? "Published" : "Draft"}
      </Badge>

      <Button
        onClick={onSave}
        disabled={!hasUnsavedChanges || isSaving}
      >
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save
      </Button>

      <Button variant="outline" onClick={onTogglePublish}>
        {isPublished ? (
          <GlobeOff className="mr-2 h-4 w-4" />
        ) : (
          <Globe className="mr-2 h-4 w-4" />
        )}
        {isPublished ? "Unpublish" : "Publish"}
      </Button>

      <Button variant="ghost" size="icon" asChild>
        <Link href={`/quizzes/${quizId}/preview`} target="_blank">
          <Eye className="h-4 w-4" />
        </Link>
      </Button>

      <Button variant="ghost" size="icon" onClick={handleCopyLink}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
