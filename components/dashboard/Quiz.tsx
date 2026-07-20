"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuizProps } from "@/types/dashboard";
import { getPracticeQuestion } from "@/utils/practice/get-practice-question";

const Quiz = ({ items }: QuizProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>();
  const orderedItems = [...items].sort((left, right) => left.sequence - right.sequence);
  const correctItem = orderedItems[0];
  const correctQuestion = getPracticeQuestion(correctItem.excerpt);

  const hasAnswered = selectedAnswer !== undefined;
  const isCorrect = selectedAnswer === correctItem.id;
  const prompt = correctQuestion.question;

  return (
    <Card className="grid h-full min-h-80 grid-rows-[auto_1fr_auto] gap-4">
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
          {items.map((item) => (
            <Button
              aria-checked={selectedAnswer === item.id}
              className="h-auto min-h-9 whitespace-normal py-2"
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
      <CardFooter className="min-h-10 flex-col items-start gap-2">
        {hasAnswered ? (
          <p className={isCorrect ? "text-emerald-600" : "text-destructive"} role="status">
            {isCorrect ? "Correct." : "Not quite. Try another answer."}
          </p>
        ) : null}
      </CardFooter>
    </Card>
  );
};

export default Quiz;
