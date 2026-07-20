import type { FunctionReturnType } from "convex/server";
import type { LucideIcon } from "lucide-react";
import { api, internal } from "@/convex/_generated/api";

export type PracticeExcerpt = {
  id: string;
  excerpt: string;
  sequence: number;
};

export type PracticeQuestion = {
  answer: string;
  question: string;
};

export type FlashcardProps = {
  item: PracticeExcerpt;
};

export type QuizProps = {
  correctItemId: string;
  items: PracticeExcerpt[];
};

export type ReorderDirection = -1 | 1;

export type ReorderProps = {
  excerpts: PracticeExcerpt[];
};

export type DashboardUser = {
  email: string;
  image?: string | null;
  name: string;
};

export type DashboardSidebarProps = {
  user: DashboardUser;
};

export type DashboardEmptyStateProps = {
  description: string;
  icon: LucideIcon;
  title: string;
};

export type DeleteSessionButtonProps = {
  className?: string;
  filename: string;
  onDeleted: (snapshot: DashboardSnapshot) => void;
  sessionId: string;
};

export type MasteryGraphData = FunctionReturnType<typeof api.mastery.getCurrentUser>;
export type MasteryNode = MasteryGraphData["nodes"][number];
export type MasteryGraphProps = {
  graph: MasteryGraphData;
};

export type PracticeExcerpts = FunctionReturnType<
  typeof api.sessions.getPracticeCurrentUser
>;
export type PracticeConceptsProps = {
  excerpts: PracticeExcerpts;
};
export type PracticeActivityPairProps = {
  excerpts: PracticeExcerpt[];
};
export type PracticeBatch = FunctionReturnType<
  typeof internal.sessions.getPracticeHistoryForOwner
>[number];
export type PracticeHistoryProps = {
  batches: PracticeBatch[];
};

export type SavedSession = FunctionReturnType<
  typeof api.sessions.listCurrentUser
>[number];
export type SavedSessionsProps = {
  onSnapshotChange: (snapshot: DashboardSnapshot) => void;
  sessions: SavedSession[];
};

export type DashboardSnapshot = FunctionReturnType<
  typeof api.sessions.getDashboardCurrentUser
>;
export type DashboardRealtimeProps = {
  initialSnapshot: DashboardSnapshot;
};
