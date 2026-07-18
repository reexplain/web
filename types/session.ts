export type SessionWorkspaceProps = {
  filename?: string;
  pageCount?: number;
  learningSessionId: string;
};

export type SessionPageProps = {
  searchParams: Promise<{ id?: string | string[] }>;
};

export type SessionTurn = {
  id: number | string;
  speaker: "AI" | "You";
  label?: "EXPLAIN" | "PROBE" | "WHY" | "CONNECT" | "APPLY" | "CHALLENGE";
  content: string;
  isOptimistic?: boolean;
};

export type ConceptState = "demonstrated" | "developing" | "unexplored";

export type Concept = {
  id?: string;
  name: string;
  description?: string;
  state: ConceptState;
  score?: number;
};

export type UnderstandingMirrorProps = {
  concepts: Concept[];
  evidence: WorkspaceEvidence[];
  openQuestions: Array<{ id: string; text: string; priority: number }>;
  summary?: string;
  understandingScore: number;
};

export type PersistedTurn = {
  id: string;
  role: "learner" | "assistant";
  interactionType?: Lowercase<NonNullable<SessionTurn["label"]>>;
  content: string;
};

export type WorkspaceOpenQuestion = {
  id: string;
  text: string;
  priority: number;
};

export type WorkspaceEvidence = {
  id: string;
  conceptName: string;
  kind: "supports" | "contradicts" | "uncertain";
  claim: string;
  rationale: string;
  strength: number;
  createdAt: number;
};

export type WorkspaceResponse = {
  status: "active" | "completed" | "abandoned";
  startedAt: number;
  completedAt?: number;
  document: { filename: string; pageCount?: number };
  turns: PersistedTurn[];
  activeConceptName?: string;
  understandingScore?: number;
  concepts: Concept[];
  evidence: WorkspaceEvidence[];
  openQuestions: WorkspaceOpenQuestion[];
  summary?: string;
};
