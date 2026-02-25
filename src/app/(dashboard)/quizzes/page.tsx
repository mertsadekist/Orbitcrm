import type { Metadata } from "next";
import Link from "next/link";
import { getTenant } from "@/lib/auth/get-tenant";
import { getQuizzes } from "@/actions/quiz/quiz-crud";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Quizzes | OrbitFlow CRM",
};

export default async function QuizzesPage() {
  await getTenant();
  const result = await getQuizzes();
  const quizzes = result.success ? result.data : [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quizzes</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage lead generation quizzes.
          </p>
        </div>
        <Button asChild>
          <Link href="/quizzes/new">
            <Plus className="mr-2 h-4 w-4" />
            New Quiz
          </Link>
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>No quizzes yet</CardTitle>
            <CardDescription>
              Create your first quiz to start generating leads.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/quizzes/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Quiz
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizzes.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell className="font-medium">{quiz.title}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {quiz.slug}
                  </TableCell>
                  <TableCell>
                    {quiz.isPublished ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {quiz.leadCount}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(quiz.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/quizzes/${quiz.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
