"use client";

import Link from "next/link";
import { FileText, History, Play, TableOfContents } from "lucide-react";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import DeleteSessionButton from "@/components/dashboard/DeleteSessionButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CONCEPT_STATE_LABEL,
  DASHBOARD_DATE_FORMATTER,
  SESSION_STATUS_LABEL,
} from "@/constants/dashboard";
import type { SavedSessionsProps } from "@/types/dashboard";

const SavedSessions = ({ onSnapshotChange, sessions }: SavedSessionsProps) => {
  return (
    <section className="flex scroll-mt-40 flex-col gap-5 lg:scroll-mt-8" id="saved-sessions">
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
        <ul className="grid auto-rows-fr gap-5 lg:grid-cols-2">
          {sessions.map((savedSession) => {
            const concepts = savedSession.concepts ?? [];

            return (
              <li className="relative min-w-0" key={savedSession.id}>
              <article className="flex h-full min-h-72 flex-col gap-5 border bg-background p-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-start gap-3">
                  <span className="grid size-12 shrink-0 place-items-center bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <FileText aria-hidden="true" className="size-5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-secondary text-lg font-medium">{savedSession.filename}</h3>
                    <p className="text-sm text-foreground/55">
                      {savedSession.pageCount ?? "-"} {savedSession.pageCount === 1 ? "page" : "pages"}
                    </p>
                  </div>
                  <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {savedSession.documentStatus === "failed"
                      ? "Needs attention"
                      : SESSION_STATUS_LABEL[savedSession.status]}
                  </span>
                </div>

                <div className="grid grid-cols-2 border-y py-4">
                  <div className="flex flex-col gap-1 border-r pr-4">
                    <span className="text-xs text-foreground/50">Understanding</span>
                    <span className="font-secondary text-2xl font-medium text-emerald-600">
                      {savedSession.understandingScore ?? 0}%
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 pl-4">
                    <span className="text-xs text-foreground/50">Concepts</span>
                    <span className="flex items-center gap-1">
                      <span className="font-secondary text-2xl font-medium">
                        {savedSession.conceptCount ?? concepts.length}
                      </span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            aria-label={`View concepts for ${savedSession.filename}`}
                            disabled={concepts.length === 0}
                            size="icon-sm"
                            title={`View concepts for ${savedSession.filename}`}
                            variant="outline"
                            className="size-6!"
                          >
                            <TableOfContents aria-hidden="true" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="max-h-80 w-80 overflow-y-auto">
                          <PopoverHeader>
                            <PopoverTitle>Session concepts</PopoverTitle>
                            <PopoverDescription>
                              Latest understanding captured for this session.
                            </PopoverDescription>
                          </PopoverHeader>
                          <ul className="flex flex-col divide-y">
                            {concepts.map((concept) => (
                              <li
                                className="flex items-center justify-between gap-4 py-3"
                                key={concept.name}
                              >
                                <span className="min-w-0 text-sm font-medium">
                                  {concept.name}
                                </span>
                                <span className="flex shrink-0 items-center gap-2">
                                  <Badge variant="outline">
                                    {CONCEPT_STATE_LABEL[concept.state]}
                                  </Badge>
                                  <span className="text-sm tabular-nums text-muted-foreground">
                                    {concept.score}%
                                  </span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </PopoverContent>
                      </Popover>
                    </span>
                  </div>
                </div>

                <p className="flex-1 text-xs text-foreground/50">
                  Last activity {DASHBOARD_DATE_FORMATTER.format(savedSession.updatedAt)}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button asChild className="w-full md:w-auto">
                    <Link href={`/session?id=${encodeURIComponent(savedSession.id)}`}>
                      <Play aria-hidden="true" data-icon="inline-start" />
                      Continue session
                    </Link>
                  </Button>
                  <Button asChild className="w-full md:w-auto" variant="outline">
                    <Link
                      href={`/session?id=${encodeURIComponent(savedSession.id)}&view=summary`}
                    >
                      View session summary
                    </Link>
                  </Button>
                  <DeleteSessionButton
                    className="static w-full md:w-auto"
                    filename={savedSession.filename}
                    onDeleted={onSnapshotChange}
                    sessionId={savedSession.id}
                  />
                </div>

              </article>
              </li>
            );
          })}
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
