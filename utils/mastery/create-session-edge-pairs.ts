export const createSessionEdgePairs = <ConceptId extends string>(
  conceptIds: Iterable<ConceptId>,
) => {
  const [anchorConceptId, ...remainingConceptIds] = Array.from(conceptIds);
  if (!anchorConceptId) return [];

  return remainingConceptIds.map((sourceConceptId) => ({
    sourceConceptId,
    targetConceptId: anchorConceptId,
  }));
};
