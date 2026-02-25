import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PixelProvider } from "@/components/tracking/pixel-provider";
import { QuizRenderer } from "@/components/quiz-renderer/quiz-renderer";
import type { QuizConfig } from "@/types/quiz";

type Props = {
  params: Promise<{ companySlug: string; quizSlug: string }>;
};

async function getPublicQuiz(companySlug: string, quizSlug: string) {
  return prisma.quiz.findFirst({
    where: {
      slug: quizSlug,
      isPublished: true,
      isActive: true,
      company: {
        slug: companySlug,
        isActive: true,
      },
    },
    include: {
      company: { select: { slug: true, name: true } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { companySlug, quizSlug } = await params;
  const quiz = await getPublicQuiz(companySlug, quizSlug);

  if (!quiz) return { title: "Quiz Not Found" };

  return {
    title: quiz.title,
    description: quiz.description ?? `${quiz.title} by ${quiz.company.name}`,
    openGraph: {
      title: quiz.title,
      description: quiz.description ?? `Take this quiz from ${quiz.company.name}`,
      siteName: quiz.company.name,
      type: "website",
    },
  };
}

export default async function PublicQuizPage({ params }: Props) {
  const { companySlug, quizSlug } = await params;
  const quiz = await getPublicQuiz(companySlug, quizSlug);

  if (!quiz) notFound();

  const config = quiz.config as unknown as QuizConfig;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <PixelProvider tracking={config.tracking}>
        <div className="py-8">
          <QuizRenderer
            quizId={quiz.id}
            config={config}
            primaryColor={quiz.primaryColor}
            backgroundImage={quiz.backgroundImage}
          />
        </div>
      </PixelProvider>
    </div>
  );
}
