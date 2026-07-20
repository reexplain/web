import {
  extractPracticeStatements,
  splitPracticeStatement,
} from "@/lib/practice-content";

describe("practice content", () => {
  it("keeps coherent PDF statements and removes navigation-like fragments", () => {
    const statements = extractPracticeStatements(
      "1 Introduction to Algorithm Design What is an algorithm? " +
        "An algorithm is a procedure that transforms a well-defined input into the required output. " +
        "5 0 1 2 3 4 5 6 7 8 Figure 1.2: A tour.",
    );

    expect(statements).toEqual([
      "An algorithm is a procedure that transforms a well-defined input into the required output.",
    ]);
  });

  it("creates a content-only cue and completion", () => {
    expect(
      splitPracticeStatement(
        "Virtual memory gives each process a private and continuous address space.",
      ),
    ).toEqual({
      cue: "Virtual memory gives each process a private",
      completion: "and continuous address space.",
    });
  });
});