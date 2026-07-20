import { getPracticeQuestion } from "@/utils/practice/get-practice-question";

describe("getPracticeQuestion", () => {
  it("turns a concept and explanation into a direct question and answer", () => {
    expect(getPracticeQuestion("Page table: Maps virtual pages to physical frames.")).toEqual({
      answer: "Maps virtual pages to physical frames.",
      question: "What does Page table mean?",
    });
  });

  it("keeps statements intact when a concept label is unavailable", () => {
    expect(getPracticeQuestion("Memory is retained after the process exits.")).toEqual({
      answer: "Memory is retained after the process exits.",
      question: "What is the key idea in this concept?",
    });
  });
});
