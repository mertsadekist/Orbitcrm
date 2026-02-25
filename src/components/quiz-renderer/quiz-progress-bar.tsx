"use client";

interface QuizProgressBarProps {
  progress: number;
  show: boolean;
}

export function QuizProgressBar({ progress, show }: QuizProgressBarProps) {
  if (!show) return null;

  return (
    <div className="h-1.5 rounded-full bg-muted">
      <div
        className="h-1.5 rounded-full"
        style={{
          width: `${progress}%`,
          backgroundColor: "var(--quiz-primary)",
          transition: "width 300ms ease",
        }}
      />
    </div>
  );
}
