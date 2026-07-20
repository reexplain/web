export type SessionWorkspaceProps = {
  filename?: string;
  initialView?: "workspace" | "summary";
  pageCount?: number;
  learningSessionId: string;
};

export type SessionPageProps = {
  searchParams: Promise<{
    id?: string | string[];
    view?: string | string[];
  }>;
};

export type SessionTurn = {
  id: number | string;
  speaker: "AI learner" | "You";
  label?: "LISTENING" | "CLARIFYING" | "FOLLOWING" | "CONNECTING" | "TRYING IT" | "STRESS TESTING" | "YOU";
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
  interactionType?: "explain" | "probe" | "why" | "connect" | "apply" | "challenge";
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
  activeDurationMs?: number;
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

export type SessionCompletionSummaryProps = {
  onReview: () => void;
  workspace: WorkspaceResponse;
};

export type EvidenceListProps = {
  emptyMessage: string;
  evidence: WorkspaceEvidence[];
  tone: "strength" | "revisit";
};
