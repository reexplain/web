type SimilarityCandidate<DocumentId extends string, Node> = {
  node: Node & { sourceDocumentIds: DocumentId[] };
  similarity: number;
};

export const selectCrossDocumentNeighbors = <DocumentId extends string, Node>(
  sourceDocumentIds: DocumentId[],
  candidates: SimilarityCandidate<DocumentId, Node>[],
  similarityThreshold: number,
  limit: number,
) => {
  const sourceDocuments = new Set(sourceDocumentIds);

  return candidates
    .filter(
      (candidate) =>
        candidate.similarity >= similarityThreshold &&
        candidate.node.sourceDocumentIds.some(
          (documentId) => !sourceDocuments.has(documentId),
        ),
    )
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, limit);
};