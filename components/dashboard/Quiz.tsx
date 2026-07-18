"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { PracticeExcerpt } from "@/types/dashboard";

const ideaCue = (excerpt: string) => {
  const words = excerpt.trim().split(/\s+/).slice(0, 12).join(" ");
  return words.length < excerpt.trim().length ? `${words}…` : words;
};

const Quiz = ({ items }: { items: PracticeExcerpt[] }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>();
  const orderedItems = [...items].sort((left, right) => left.sequence - right.sequence);
  const correctItem = orderedItems[0];

  const hasAnswered = selectedAnswer !== undefined;
  const isCorrect = selectedAnswer === correctItem.id;
  const prompt = `Which passage develops this idea: “${ideaCue(correctItem.excerpt)}”?`;

  return (
    <Card className="grid h-96 grid-rows-[auto_1fr_auto] gap-4">
      <CardHeader className="gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-500">
          Quick quiz
        </p>
        <CardTitle className="font-secondary text-xl font-medium">{prompt}</CardTitle>
      </CardHeader>
      <CardContent
        aria-label="Quiz answers"
        className="min-h-0 overflow-y-auto"
        role="region"
        tabIndex={0}
      >
        <div className="flex flex-col gap-2" role="radiogroup" aria-label={prompt}>
          {items.map((item) => (
            <Button
              aria-checked={selectedAnswer === item.id}
              className="h-auto min-h-9 whitespace-normal py-2 text-left"
              key={item.id}
              onClick={() => setSelectedAnswer(item.id)}
              role="radio"
              variant="outline"
            >
              {item.excerpt}
            </Button>
          ))}
        </div>
      </CardContent>
      <CardFooter className="min-h-10 flex-col items-start gap-2">
        {hasAnswered ? (
          <p className={isCorrect ? "text-emerald-600" : "text-destructive"} role="status">
            {isCorrect ? "Correct." : "Not quite. Check the source order and try again."}
          </p>
        ) : null}
      </CardFooter>
    </Card>
  );
};

export default Quiz;
