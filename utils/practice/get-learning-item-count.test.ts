import { getLearningItemCount } from "@/utils/practice/get-learning-item-count";

describe("getLearningItemCount", () => {
  it.each([
    [0, 0],
    [1, 1],
    [3, 2],
  ])("returns %i learning items for %i practice excerpts", (practiceExcerptCount, expected) => {
    expect(getLearningItemCount(practiceExcerptCount)).toBe(expected);
  });
});
