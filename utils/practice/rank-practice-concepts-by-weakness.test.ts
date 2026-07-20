import { rankPracticeConceptsByWeakness } from "@/utils/practice/rank-practice-concepts-by-weakness";

describe("rankPracticeConceptsByWeakness", () => {
  it("prioritizes unresolved states and lower scores", () => {
    const concepts = [
      { name: "Strong", state: "demonstrated" as const, score: 92, sequence: 0 },
      { name: "Partial", state: "developing" as const, score: 55, sequence: 1 },
      { name: "Weakest partial", state: "developing" as const, score: 24, sequence: 2 },
      { name: "Unexplored", state: "unexplored" as const, score: 0, sequence: 3 },
    ];

    expect(rankPracticeConceptsByWeakness(concepts).map((concept) => concept.name))
      .toEqual(["Unexplored", "Weakest partial", "Partial", "Strong"]);
  });

  it("uses the original concept sequence to break equal weakness ties", () => {
    const concepts = [
      { name: "Second", state: "developing" as const, score: 40, sequence: 2 },
      { name: "First", state: "developing" as const, score: 40, sequence: 1 },
    ];

    expect(rankPracticeConceptsByWeakness(concepts).map((concept) => concept.name))
      .toEqual(["First", "Second"]);
  });
});