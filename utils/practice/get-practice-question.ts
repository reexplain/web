import type { PracticeQuestion } from "@/types/dashboard";

const normaliseText = (value: string) => value.replace(/\s+/g, " ").trim();

export const getPracticeQuestion = (excerpt: string): PracticeQuestion => {
  const statement = normaliseText(excerpt);
  const separatorIndex = statement.indexOf(":");

  if (separatorIndex <= 0 || separatorIndex === statement.length - 1) {
    return {
      answer: statement,
      question: "What is the key idea in this concept?",
    };
  }

  const concept = statement.slice(0, separatorIndex).trim();
  const answer = statement.slice(separatorIndex + 1).trim();

  return {
    answer,
    question: `What does ${concept} mean?`,
  };
};
