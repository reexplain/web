const weaknessRank = {
  unexplored: 0,
  developing: 1,
  demonstrated: 2,
} as const;

export const rankPracticeConceptsByWeakness = <Concept extends {
  score: number;
  sequence: number;
  state: keyof typeof weaknessRank;
}>(concepts: Concept[]) => [...concepts].sort((left, right) =>
  weaknessRank[left.state] - weaknessRank[right.state] ||
  left.score - right.score ||
  left.sequence - right.sequence,
);