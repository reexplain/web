"use client";

import Flashcard from "@/components/dashboard/Flashcard";
import Quiz from "@/components/dashboard/Quiz";
import { QUIZ_FALLBACK_OPTIONS, QUIZ_OPTION_COUNT } from "@/constants/practice";
import type { PracticeActivityPairProps } from "@/types/dashboard";

const PracticeActivityPair = ({ excerpts }: PracticeActivityPairProps) => {
  const correctQuizItem = excerpts[1];
  const quizItems = [
    ...excerpts.slice(1, QUIZ_OPTION_COUNT + 1),
    ...excerpts.slice(0, 1),
  ].slice(0, QUIZ_OPTION_COUNT);
  const quizOptions = [
    ...quizItems,
    ...QUIZ_FALLBACK_OPTIONS.slice(0, QUIZ_OPTION_COUNT - quizItems.length).map(
      (excerpt, index) => ({
        id: `quiz-fallback-${index}`,
        excerpt,
        sequence: Number.MAX_SAFE_INTEGER - index,
      }),
    ),
  ];

  return (
    <div
      aria-label="Practice activities"
      className="grid auto-rows-fr items-stretch gap-4 lg:grid-cols-2"
    >
      <Flashcard item={excerpts[0]} />
      {correctQuizItem ? (
        <Quiz correctItemId={correctQuizItem.id} items={quizOptions} />
      ) : null}
    </div>
  );
};

export default PracticeActivityPair;
