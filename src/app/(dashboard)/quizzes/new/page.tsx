import type { Metadata } from "next";
import { CreateQuizForm } from "@/components/quiz-builder/create-quiz-form";

export const metadata: Metadata = {
  title: "New Quiz | OrbitFlow CRM",
};

export default function NewQuizPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <CreateQuizForm />
    </div>
  );
}
