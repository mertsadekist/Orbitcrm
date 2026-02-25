"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { QuestionList } from "@/components/quiz-builder/question-list";
import { QuestionEditor } from "@/components/quiz-builder/question-editor";
import { QuizSettingsPanel } from "@/components/quiz-builder/quiz-settings-panel";
import { PublishControls } from "@/components/quiz-builder/publish-controls";
import { createDefaultQuestion } from "@/lib/quiz/config-helpers";
import { updateQuizConfig, togglePublish } from "@/actions/quiz/quiz-crud";
import type { QuizConfig, QuizQuestion, QuizQuestionType } from "@/types/quiz";

interface QuizBuilderShellProps {
  quiz: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    primaryColor: string;
    backgroundImage: string | null;
    isPublished: boolean;
    config: QuizConfig;
    companySlug: string;
  };
}

export function QuizBuilderShell({ quiz }: QuizBuilderShellProps) {
  const [config, setConfig] = useState<QuizConfig>(quiz.config);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPublished, setIsPublished] = useState(quiz.isPublished);

  const selectedQuestion = config.questions.find(
    (q) => q.id === selectedQuestionId
  );

  const handleAddQuestion = useCallback(
    (type: QuizQuestionType) => {
      const newQuestion = createDefaultQuestion(type);
      setConfig((prev) => ({
        ...prev,
        questions: [...prev.questions, newQuestion],
      }));
      setSelectedQuestionId(newQuestion.id);
      setHasUnsavedChanges(true);
    },
    []
  );

  const handleDeleteQuestion = useCallback(
    (id: string) => {
      setConfig((prev) => ({
        ...prev,
        questions: prev.questions.filter((q) => q.id !== id),
      }));
      if (selectedQuestionId === id) {
        setSelectedQuestionId(null);
      }
      setHasUnsavedChanges(true);
    },
    [selectedQuestionId]
  );

  const handleReorder = useCallback((questions: QuizQuestion[]) => {
    setConfig((prev) => ({ ...prev, questions }));
    setHasUnsavedChanges(true);
  }, []);

  const handleQuestionChange = useCallback((updated: QuizQuestion) => {
    setConfig((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === updated.id ? updated : q)),
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleConfigChange = useCallback((updatedConfig: QuizConfig) => {
    setConfig(updatedConfig);
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await updateQuizConfig(quiz.id, config);
      if (result.success) {
        toast.success("Quiz saved successfully");
        setHasUnsavedChanges(false);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to save quiz");
    } finally {
      setIsSaving(false);
    }
  }, [quiz.id, config]);

  const handleTogglePublish = useCallback(async () => {
    try {
      const result = await togglePublish(quiz.id);
      if (result.success) {
        setIsPublished(result.data.isPublished);
        toast.success(
          result.data.isPublished ? "Quiz published" : "Quiz unpublished"
        );
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to toggle publish status");
    }
  }, [quiz.id]);

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h1 className="text-lg font-semibold">{quiz.title}</h1>
        <PublishControls
          quizId={quiz.id}
          isPublished={isPublished}
          companySlug={quiz.companySlug}
          quizSlug={quiz.slug}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSave}
          onTogglePublish={handleTogglePublish}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Question list */}
        <div className="w-72 border-r">
          <QuestionList
            questions={config.questions}
            selectedId={selectedQuestionId}
            onSelectQuestion={setSelectedQuestionId}
            onReorder={handleReorder}
            onAddQuestion={handleAddQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        </div>

        {/* Center panel - Question editor */}
        <div className="flex-1 overflow-auto p-6">
          {selectedQuestion ? (
            <QuestionEditor
              question={selectedQuestion}
              onChange={handleQuestionChange}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a question to edit
            </div>
          )}
        </div>

        {/* Right panel - Settings */}
        <div className="w-80 overflow-auto border-l p-4">
          <QuizSettingsPanel config={config} onChange={handleConfigChange} />
        </div>
      </div>
    </div>
  );
}
