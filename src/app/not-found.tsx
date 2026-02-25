import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileQuestion } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2">
            <FileQuestion className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
