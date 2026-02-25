import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuizById } from "@/actions/quiz/quiz-crud";
import { QuizRenderer } from "@/components/quiz-renderer/quiz-renderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye } from "lucide-react";

type Props = {
  params: Promise<{ quizId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { quizId } = await params;
  const result = await getQuizById(quizId);
  if (!result.success) return { title: "Preview" };
  return { title: `Preview: ${result.data.title}` };
}

export default async function QuizPreviewPage({ params }: Props) {
  const { quizId } = await params;
  const result = await getQuizById(quizId);

  if (!result.success) notFound();

  const quiz = result.data;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/quizzes/${quiz.id}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Builder
            </Link>
          </Button>
          <Badge variant="outline">
            <Eye className="mr-1 h-3 w-3" />
            Preview Mode
          </Badge>
        </div>
      </div>
      <div className="py-8">
        <QuizRenderer
          quizId={quiz.id}
          config={quiz.config}
          primaryColor={quiz.primaryColor}
          backgroundImage={quiz.backgroundImage}
        />
      </div>
    </div>
  );
}
