const MIN_STATEMENT_WORDS = 7;
const MIN_STATEMENT_LENGTH = 45;
const MAX_STATEMENT_LENGTH = 220;

const isContentStatement = (statement: string) => {
  const words = statement.split(/\s+/);
  const letterCount = (statement.match(/[a-z]/gi) ?? []).length;
  const digitCount = (statement.match(/\d/g) ?? []).length;

  return (
    statement.length >= MIN_STATEMENT_LENGTH &&
    statement.length <= MAX_STATEMENT_LENGTH &&
    words.length >= MIN_STATEMENT_WORDS &&
    letterCount / statement.length >= 0.55 &&
    digitCount / statement.length <= 0.12 &&
    !/^\s*\d+(?:\.\d+)*\s/.test(statement) &&
    !/\.{3,}/.test(statement)
  );
};

export const extractPracticeStatements = (text: string) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  return normalized
    .split(/(?<=[.!?])\s+/)
    .map((statement) => statement.trim())
    .filter(isContentStatement);
};

export const splitPracticeStatement = (statement: string) => {
  const words = statement.trim().split(/\s+/);
  const splitAt = Math.max(3, Math.min(words.length - 2, Math.ceil(words.length * 0.55)));

  return {
    cue: words.slice(0, splitAt).join(" "),
    completion: words.slice(splitAt).join(" "),
  };
};