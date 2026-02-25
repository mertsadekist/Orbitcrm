"use client";

import type { QuizWelcomeScreen as QuizWelcomeScreenType } from "@/types/quiz";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuizWelcomeScreenProps {
  welcomeScreen: QuizWelcomeScreenType;
  onStart: () => void;
}

export function QuizWelcomeScreen({
  welcomeScreen,
  onStart,
}: QuizWelcomeScreenProps) {
  return (
    <div className="flex items-center justify-center animate-in fade-in duration-500">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-2xl">
            {welcomeScreen.title ?? "Welcome"}
          </CardTitle>
        </CardHeader>

        {welcomeScreen.description && (
          <CardContent>
            <p className="text-muted-foreground">{welcomeScreen.description}</p>
          </CardContent>
        )}

        <CardFooter className="justify-center">
          <Button size="lg" onClick={onStart}>
            {welcomeScreen.buttonText || "Start"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
