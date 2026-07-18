"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, History } from "lucide-react";
import { useConvexAuth, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import DeleteSessionButton from "@/components/dashboard/DeleteSessionButton";

type SavedSession = FunctionReturnType<typeof api.sessions.listCurrentUser>[number];

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});

const sessionStatusLabel = {
  active: "In progress",
  completed: "Completed",
  abandoned: "In progress",
} as const;

const SavedSessions = ({ initialSessions }: { initialSessions: SavedSession[] }) => {
  const [deletedSessionIds, setDeletedSessionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const { isAuthenticated } = useConvexAuth();
  const subscribedSessions = useQuery(
    api.sessions.listCurrentUser,
    isAuthenticated ? {} : "skip",
  );
  const sessions = (subscribedSessions ?? initialSessions).filter(
    (session) => !deletedSessionIds.has(session.id),
  );

  const removeDeletedSession = (sessionId: string) => {
    setDeletedSessionIds((current) => new Set(current).add(sessionId));
  };

  return (
    <section className="flex scroll-mt-8 flex-col gap-5" id="saved-sessions">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-1 sm:gap-3 border-b pb-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-500">
            Library
          </p>
          <h2 className="font-secondary text-3xl font-medium">Saved learning sessions</h2>
        </div>
        <span className="text-sm text-foreground/55 py-1">
          {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
        </span>
      </div>

      {sessions.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {sessions.map((savedSession) => (
            <li className="relative" key={savedSession.id}>
              <Link
                className="flex min-h-36 flex-col justify-between gap-5 border bg-background p-5 transition-colors hover:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                href={`/session?id=${encodeURIComponent(savedSession.id)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-12 shrink-0 place-items-center bg-emerald-50 text-emerald-600">
                    <FileText aria-hidden="true" className="size-5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-secondary text-lg font-medium">{savedSession.filename}</h3>
                    <p className="text-sm text-foreground/55">
                      {savedSession.pageCount ?? "-"} {savedSession.pageCount === 1 ? "page" : "pages"}
                    </p>
                  </div>
                  <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                    {savedSession.documentStatus === "failed"
                      ? "Needs attention"
                      : sessionStatusLabel[savedSession.status]}
                  </span>
                </div>
                <p className="pr-10 text-xs text-foreground/50">
                  Last activity {dateFormatter.format(savedSession.updatedAt)}
                </p>
              </Link>
              <DeleteSessionButton
                filename={savedSession.filename}
                onDeleted={removeDeletedSession}
                sessionId={savedSession.id}
              />
            </li>
          ))}
        </ul>
      ) : (
        <DashboardEmptyState
          description="Upload your first PDF above. It will appear here after processing begins."
          icon={History}
          title="No saved sessions yet"
        />
      )}
    </section>
  );
};

export default SavedSessions;