import { MAX_PRACTICE_LEARNING_ITEMS } from "@/constants/practice";

export const getLearningItemCount = (practiceExcerptCount: number) =>
  Math.min(MAX_PRACTICE_LEARNING_ITEMS, practiceExcerptCount);
