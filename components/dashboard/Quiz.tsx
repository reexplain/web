"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuizProps } from "@/types/dashboard";
import { getPracticeQuestion } from "@/utils/practice/get-practice-question";

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

const Quiz = ({ items }: QuizProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>();
  const orderedItems = [...items].sort((left, right) => left.sequence - right.sequence);
  const correctItem = orderedItems[0];
  const correctQuestion = getPracticeQuestion(correctItem.excerpt);
  const options = shuffleOptions(items, correctItem.id);

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
          {options.map((item) => (
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
