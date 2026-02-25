"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createQuiz } from "@/actions/quiz/quiz-crud";

const createQuizSchema = z.object({
  title: z.string().min(1, "Title required"),
  slug: z
    .string()
    .min(1, "Slug required")
    .regex(/^[a-z0-9-]+$/, "Lowercase, numbers, hyphens only"),
});

type CreateQuizFormValues = z.infer<typeof createQuizSchema>;

export function CreateQuizForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateQuizFormValues>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: {
      title: "",
      slug: "",
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setValue("title", title);
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setValue("slug", slug);
  };

  const onSubmit = async (data: CreateQuizFormValues) => {
    const result = await createQuiz(data.title, data.slug);

    if (result.success) {
      toast.success("Quiz created successfully");
      router.push(`/quizzes/${result.data.id}`);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create New Quiz</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register("title")}
              onChange={handleTitleChange}
              placeholder="My Quiz"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              {...register("slug")}
              placeholder="my-quiz"
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Quiz
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
