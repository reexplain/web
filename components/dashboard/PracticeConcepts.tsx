"use client";

import { BookOpenCheck } from "lucide-react";
import { useConvexAuth, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import Flashcard from "@/components/dashboard/Flashcard";
import Quiz from "@/components/dashboard/Quiz";
import Reorder from "@/components/dashboard/Reorder";

type PracticeExcerpts = FunctionReturnType<typeof api.sessions.getPracticeCurrentUser>;

const PracticeConcepts = ({ initialExcerpts }: { initialExcerpts: PracticeExcerpts }) => {
  const { isAuthenticated } = useConvexAuth();
  const subscribedExcerpts = useQuery(
    api.sessions.getPracticeCurrentUser,
    isAuthenticated ? {} : "skip",
  );
  const excerpts = subscribedExcerpts ?? initialExcerpts;
  const contentKey = excerpts.map((item) => item.id).join(":");

  return (
    <section className="flex scroll-mt-8 flex-col gap-5" id="practice">
      <div className="flex flex-col items-start justify-between gap-1 border-b pb-4 sm:flex-row sm:items-end sm:gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-500">
            Learning lab
          </p>
          <h2 className="font-secondary text-3xl font-medium">Practice concepts</h2>
        </div>
        <p className="py-1 text-sm text-foreground/55">Test your knowledge</p>
      </div>

      {excerpts.length > 0 ? (
        <div
          aria-label="Practice activities"
          className="grid items-stretch gap-4 xl:grid-cols-3"
          key={contentKey}
        >
          <Flashcard item={excerpts[0]} />
          {excerpts.length >= 2 ? <Quiz items={excerpts.slice(0, 3)} /> : null}
          {excerpts.length >= 3 ? <Reorder excerpts={excerpts.slice(0, 4)} /> : null}
        </div>
      ) : (
        <DashboardEmptyState
          description="Concepts from completed sessions will appear here after you end the session."
          icon={BookOpenCheck}
          title="Complete a session to unlock practice"
        />
      )}
    </section>
  );
};

export default PracticeConcepts;