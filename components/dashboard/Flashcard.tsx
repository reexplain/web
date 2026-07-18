"use client";

import { useState } from "react";
import type { PracticeExcerpt } from "@/types/dashboard";
import { cn } from "@/utils/ui/cn";

const conceptPrompt = (excerpt: string) => {
  const firstSentence = excerpt.match(/^.*?[.!?](?:\s|$)/)?.[0] ?? excerpt;
  return firstSentence.trim().slice(0, 180);
};

const Flashcard = ({ item }: { item: PracticeExcerpt }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <button
      aria-label={`Flashcard ${isFlipped ? "answer" : "question"}. Click to flip.`}
      aria-pressed={isFlipped}
      className="group h-96 w-full text-left perspective-[1000px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-4"
      onClick={() => setIsFlipped((current) => !current)}
      type="button"
    >
      <div
        className={cn(
          "relative h-full w-full transform-3d transition-transform duration-500 motion-reduce:transition-none",
          isFlipped ? "transform-[rotateY(180deg)]" : "transform-[rotateY(0deg)]",
        )}
      >
        <div
          aria-hidden={isFlipped}
          className="absolute inset-0 flex flex-col border bg-card p-6 text-center shadow-sm backface-hidden"
        >
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-500">
            Flashcard
          </p>
          <div
            aria-label="Flashcard prompt"
            className="flex min-h-0 flex-1 items-center overflow-y-auto py-4"
            role="region"
            tabIndex={0}
          >
            <p className="font-secondary w-full text-2xl font-medium leading-tight">
              Explain this idea in your own words: {conceptPrompt(item.excerpt)}
            </p>
          </div>
          <p className="text-sm text-foreground/60">Click to reveal the answer</p>
        </div>

        <div
          aria-hidden={!isFlipped}
          className="absolute inset-0 flex transform-[rotateY(180deg)] flex-col border border-emerald-500 bg-emerald-50 p-6 text-center shadow-sm backface-hidden"
          data-testid="flashcard-answer"
        >
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-600">
            Answer
          </p>
          <div
            aria-label="Flashcard answer"
            className="flex min-h-0 flex-1 items-center overflow-y-auto py-4"
            role="region"
            tabIndex={0}
          >
            <p className="w-full leading-relaxed text-foreground/75">{item.excerpt}</p>
          </div>
          <p className="text-sm text-foreground/60">Click to return to the prompt</p>
        </div>
      </div>
    </button>
  );
};

export default Flashcard;
