import { selectCrossDocumentNeighbors } from "@/utils/mastery/select-cross-document-neighbors";

describe("selectCrossDocumentNeighbors", () => {
  it("reserves similarity links for concepts backed by different documents", () => {
    const candidates = [
      { node: { id: "same-document", sourceDocumentIds: ["document-1"] }, similarity: 0.99 },
      { node: { id: "related-document", sourceDocumentIds: ["document-2"] }, similarity: 0.91 },
      { node: { id: "another-document", sourceDocumentIds: ["document-3"] }, similarity: 0.85 },
    ];

    expect(selectCrossDocumentNeighbors(["document-1"], candidates, 0.28, 2))
      .toEqual([candidates[1], candidates[2]]);
  });

  it("excludes cross-document concepts below the similarity threshold", () => {
    const candidates = [
      { node: { id: "weak-match", sourceDocumentIds: ["document-2"] }, similarity: 0.27 },
    ];

    expect(selectCrossDocumentNeighbors(["document-1"], candidates, 0.28, 3))
      .toEqual([]);
  });
});