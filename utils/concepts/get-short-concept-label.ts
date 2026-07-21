import {
  COMPACT_CONCEPT_LABEL_MAX_LENGTH,
  COMPACT_CONCEPT_LABEL_MAX_WORDS,
} from "@/constants/concepts";

const addEllipsis = (value: string) => `${value.trimEnd()}…`;

export const getShortConceptLabel = (conceptName: string) => {
  const normalizedName = conceptName.trim().replace(/\s+/g, " ");
  const words = normalizedName.split(" ");
  const wordLimitedName = words.length > COMPACT_CONCEPT_LABEL_MAX_WORDS
    ? addEllipsis(words.slice(0, COMPACT_CONCEPT_LABEL_MAX_WORDS).join(" "))
    : normalizedName;

  if (wordLimitedName.length <= COMPACT_CONCEPT_LABEL_MAX_LENGTH) {
    return wordLimitedName;
  }

  return addEllipsis(wordLimitedName.slice(0, COMPACT_CONCEPT_LABEL_MAX_LENGTH - 1));
};
