import { createSessionEdgePairs } from "@/utils/mastery/create-session-edge-pairs";

describe("createSessionEdgePairs", () => {
  it("connects every concept from a session to one shared concept", () => {
    expect(createSessionEdgePairs(["concept-1", "concept-2", "concept-3"])).toEqual([
      { sourceConceptId: "concept-2", targetConceptId: "concept-1" },
      { sourceConceptId: "concept-3", targetConceptId: "concept-1" },
    ]);
  });

  it("does not create a self-connection for a single concept", () => {
    expect(createSessionEdgePairs(["concept-1"])).toEqual([]);
  });
});
