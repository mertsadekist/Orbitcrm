import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuizLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="space-y-6 p-8">
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
