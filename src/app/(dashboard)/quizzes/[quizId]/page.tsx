import { notFound } from "next/navigation";
import { getQuizById } from "@/actions/quiz/quiz-crud";
import { QuizBuilderShell } from "@/components/quiz-builder/quiz-builder-shell";

type Props = {
  params: Promise<{ quizId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { quizId } = await params;
  const result = await getQuizById(quizId);
  if (!result.success) return { title: "Quiz Not Found" };
  return { title: `${result.data.title} | Quiz Builder` };
}

export default async function QuizBuilderPage({ params }: Props) {
  const { quizId } = await params;
  const result = await getQuizById(quizId);

  if (!result.success) notFound();

  return <QuizBuilderShell quiz={result.data} />;
}
