"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuizProps } from "@/types/dashboard";
import { getPracticeQuestion } from "@/utils/practice/get-practice-question";
import { cn } from "@/utils/ui/cn";

const hashOptionIds = (ids: string[]) => {
  let hash = 2_166_136_261;
  for (const character of ids.join("|")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
};

const shuffleOptions = (items: QuizProps["items"], correctId: string) => {
  const options = [...items];
  let seed = hashOptionIds(options.map((item) => item.id));
  const nextRandom = () => {
    seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
    return seed / 4_294_967_296;
  };

  for (let index = options.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextRandom() * (index + 1));
    [options[index], options[swapIndex]] = [options[swapIndex], options[index]];
  }

  if (options.length > 1 && options[0].id === correctId) {
    const swapIndex = 1 + Math.floor(nextRandom() * (options.length - 1));
    [options[0], options[swapIndex]] = [options[swapIndex], options[0]];
  }

  return options;
};

const Quiz = ({ correctItemId, items }: QuizProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>();
  const correctItem = items.find((item) => item.id === correctItemId) ?? items[0];
  const correctQuestion = getPracticeQuestion(correctItem.excerpt);
  const options = shuffleOptions(items, correctItem.id);

  const prompt = correctQuestion.question;

  return (
    <Card className="grid h-full min-h-80 grid-rows-[auto_1fr] gap-4">
      <CardHeader className="gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-500">
          Quick quiz
        </p>
        <CardTitle className="font-secondary text-xl font-medium">{prompt}</CardTitle>
      </CardHeader>
      <CardContent
        aria-label="Quiz answers"
        className="min-h-0"
        role="region"
        tabIndex={0}
      >
        <div className="flex flex-col gap-2" role="radiogroup" aria-label={prompt}>
          {options.map((item) => (
            <Button
              aria-checked={selectedAnswer === item.id}
              className={cn(
                "h-auto min-h-9 whitespace-normal py-2 hover:border-border hover:bg-background dark:hover:border-input dark:hover:bg-input/30",
                selectedAnswer === item.id && item.id === correctItem.id &&
                  "border-emerald-500 bg-emerald-500 text-white hover:text-white hover:border-emerald-500 hover:bg-emerald-500 dark:border-emerald-600 dark:bg-emerald-600 dark:hover:border-emerald-600 dark:hover:bg-emerald-600",
                selectedAnswer === item.id && item.id !== correctItem.id &&
                  "border-destructive bg-destructive text-white hover:text-white hover:border-destructive hover:bg-destructive dark:border-destructive/90 dark:bg-destructive/90 dark:hover:border-destructive/90 dark:hover:bg-destructive/90",
              )}
              key={item.id}
              onClick={() => setSelectedAnswer(item.id)}
              role="radio"
              variant="outline"
            >
              {getPracticeQuestion(item.excerpt).answer}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Quiz;
