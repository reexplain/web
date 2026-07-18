import "server-only";

const FASTAPI_URL = process.env.REEXPLAIN_API_URL ?? "http://127.0.0.1:8000";

export type ConceptAssessment = {
  name: string;
  description: string;
  state: "unexplored" | "developing" | "demonstrated";
  score: number;
};

export type LearningTurnResult = {
  content: string;
  interaction_type: "explain" | "probe" | "why" | "connect" | "apply" | "challenge";
  active_concept: string;
  concepts: ConceptAssessment[];
  evidence: Array<{
    concept_name: string;
    kind: "supports" | "contradicts" | "uncertain";
    claim: string;
    rationale: string;
    strength: number;
  }>;
  open_questions: Array<{
    concept_name: string | null;
    text: string;
    priority: number;
  }>;
  understanding_score: number;
  summary: string;
};

export class ReExplainApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const formatValidationDetail = (detail: unknown) => {
  if (!Array.isArray(detail)) return null;

  const messages = detail.flatMap((issue) => {
    if (!issue || typeof issue !== "object") return [];
    const candidate = issue as { loc?: unknown; msg?: unknown };
    if (typeof candidate.msg !== "string") return [];
    const location = Array.isArray(candidate.loc)
      ? candidate.loc
          .filter((part) => part !== "body")
          .filter((part): part is string | number =>
            typeof part === "string" || typeof part === "number",
          )
          .join(".")
      : "";
    return [location ? `${location}: ${candidate.msg}` : candidate.msg];
  });

  return messages.length > 0 ? messages.join(" ") : null;
};

const getBackendErrorMessage = (body: unknown) => {
  if (!body || typeof body !== "object") return null;
  const candidate = body as { detail?: unknown; error?: unknown };
  if (typeof candidate.detail === "string" && candidate.detail.trim()) {
    return candidate.detail;
  }
  if (typeof candidate.error === "string" && candidate.error.trim()) {
    return candidate.error;
  }
  return formatValidationDetail(candidate.detail);
};

const isConceptAssessment = (value: unknown): value is ConceptAssessment => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ConceptAssessment>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.description === "string" &&
    ["unexplored", "developing", "demonstrated"].includes(candidate.state ?? "") &&
    typeof candidate.score === "number"
  );
};

export const isLearningTurnResult = (value: unknown): value is LearningTurnResult => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LearningTurnResult>;
  return (
    typeof candidate.content === "string" &&
    ["explain", "probe", "why", "connect", "apply", "challenge"].includes(
      candidate.interaction_type ?? "",
    ) &&
    typeof candidate.active_concept === "string" &&
    Array.isArray(candidate.concepts) &&
    candidate.concepts.every(isConceptAssessment) &&
    Array.isArray(candidate.evidence) &&
    candidate.evidence.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.concept_name === "string" &&
        ["supports", "contradicts", "uncertain"].includes(item.kind) &&
        typeof item.claim === "string" &&
        typeof item.rationale === "string" &&
        typeof item.strength === "number",
    ) &&
    Array.isArray(candidate.open_questions) &&
    candidate.open_questions.every(
      (item) =>
        item &&
        typeof item === "object" &&
        (item.concept_name === null || typeof item.concept_name === "string") &&
        typeof item.text === "string" &&
        typeof item.priority === "number",
    ) &&
    typeof candidate.understanding_score === "number" &&
    typeof candidate.summary === "string"
  );
};

export const isEmbeddingResult = (
  value: unknown,
): value is { model: string; embeddings: number[][] } => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { model?: unknown; embeddings?: unknown };
  return (
    typeof candidate.model === "string" &&
    Array.isArray(candidate.embeddings) &&
    candidate.embeddings.every(
      (embedding) =>
        Array.isArray(embedding) &&
        embedding.length === 1536 &&
        embedding.every((number) => typeof number === "number" && Number.isFinite(number)),
    )
  );
};

export async function callReExplainApi<T>(
  path: string,
  init: RequestInit,
  validate: (value: unknown) => value is T,
): Promise<T> {
  const serviceKey = process.env.REEXPLAIN_API_SERVICE_KEY;
  if (!serviceKey) {
    throw new ReExplainApiError("The document service is not configured.", 503);
  }

  const headers = new Headers(init.headers);
  headers.set("X-ReExplain-Service-Key", serviceKey);
  let response: Response;
  try {
    response = await fetch(`${FASTAPI_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ReExplainApiError("The document service could not be reached.", 503);
  }
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      getBackendErrorMessage(body) ??
      `The document service request failed with status ${response.status}.`;
    throw new ReExplainApiError(message, response.status);
  }
  if (!validate(body)) {
    throw new ReExplainApiError("The document service returned an invalid response.", 502);
  }

  return body;
}