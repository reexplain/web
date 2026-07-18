import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  MessageSquareText,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Concept, WorkspaceEvidence, WorkspaceResponse } from "@/types/session";
import { cn } from "@/utils/ui/cn";

type SessionCompletionSummaryProps = {
  onReview: () => void;
  workspace: WorkspaceResponse;
};

const formatDuration = (startedAt: number, completedAt?: number) => {
  if (!completedAt || completedAt <= startedAt) return "Saved just now";
  const totalMinutes = Math.floor((completedAt - startedAt) / 60_000);
  if (totalMinutes < 1) return "Less than a minute";
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
};

const conceptStateLabel: Record<Concept["state"], string> = {
  demonstrated: "Demonstrated",
  developing: "Developing",
  unexplored: "Not yet shown",
};

const EvidenceList = ({
  emptyMessage,
  evidence,
  tone,
}: {
  emptyMessage: string;
  evidence: WorkspaceEvidence[];
  tone: "strength" | "revisit";
}) => (
  <ul className="flex flex-col divide-y">
    {evidence.slice(0, 4).map((item) => (
      <li className="grid grid-cols-[1.25rem_1fr] gap-3 py-4" key={item.id}>
        <span
          className={cn(
            "grid size-5 place-items-center text-white",
            tone === "strength" ? "bg-emerald-500" : "bg-orange-500",
          )}
        >
          {tone === "strength" ? (
            <Check aria-hidden="true" className="size-3" strokeWidth={2.5} />
          ) : (
            <AlertTriangle aria-hidden="true" className="size-3" strokeWidth={2.2} />
          )}
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-medium">{item.conceptName}</span>
          <span className="text-sm leading-5 text-foreground/65">{item.claim}</span>
          <span className="text-xs leading-5 text-foreground/45">{item.rationale}</span>
        </span>
      </li>
    ))}
    {evidence.length === 0 ? (
      <li className="py-4 text-sm text-foreground/50">{emptyMessage}</li>
    ) : null}
  </ul>
);

const SessionCompletionSummary = ({
  onReview,
  workspace,
}: SessionCompletionSummaryProps) => {
  const demonstratedCount = workspace.concepts.filter(
    (concept) => concept.state === "demonstrated",
  ).length;
  const learnerResponseCount = workspace.turns.filter(
    (turn) => turn.role === "learner",
  ).length;
  const strengths = workspace.evidence.filter((item) => item.kind === "supports");
  const revisits = workspace.evidence.filter((item) => item.kind !== "supports");
  const hasFullCoverage =
    workspace.concepts.length > 0 && demonstratedCount === workspace.concepts.length;
  const understandingScore = workspace.understandingScore ?? 0;
  const sortedConcepts = [...workspace.concepts].sort(
    (left, right) => (right.score ?? 0) - (left.score ?? 0),
  );

  return (
    <div className="max-h-[calc(100dvh-9.5rem)] overflow-y-auto border bg-background shadow-[7px_7px_0_#d1fae5]">
      <header className="grid gap-8 border-b bg-emerald-50 px-6 py-8 sm:px-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-12 lg:py-10">
        <div className="flex max-w-3xl flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
            {hasFullCoverage ? "Session complete" : "Progress saved"}
          </p>
          <div className="flex flex-col gap-2">
            <h1 className="font-secondary text-3xl font-medium sm:text-4xl">
              Here&apos;s what your explanations revealed
            </h1>
            <p className="text-sm text-foreground/55">
              {workspace.document.filename} · {workspace.document.pageCount ?? "-"} {workspace.document.pageCount === 1 ? "page" : "pages"}
            </p>
          </div>
          <p className="max-w-2xl text-base leading-7 text-foreground/70">
            {workspace.summary ??
              "Your progress has been saved. Continue practicing the concepts that still need evidence."}
          </p>
        </div>
        <div className="flex items-baseline gap-1 text-emerald-700">
          <span className="font-secondary text-7xl font-medium tabular-nums">
            {understandingScore}
          </span>
          <span className="text-lg font-medium">%</span>
        </div>
      </header>

      <section className="grid border-b sm:grid-cols-2 lg:grid-cols-4" aria-label="Session statistics">
        {[
          { icon: Clock3, label: "Time invested", value: formatDuration(workspace.startedAt, workspace.completedAt) },
          { icon: MessageSquareText, label: "Responses evaluated", value: String(learnerResponseCount) },
          { icon: BookOpen, label: "Concepts demonstrated", value: `${demonstratedCount} of ${workspace.concepts.length}` },
          { icon: Check, label: "Strong evidence", value: `${strengths.length} of ${workspace.evidence.length}` },
        ].map(({ icon: Icon, label, value }) => (
          <div className="flex items-center gap-3 border-b px-6 py-5 last:border-b-0 sm:border-r sm:nth-2:border-r-0 lg:border-b-0 lg:nth-2:border-r lg:last:border-r-0" key={label}>
            <Icon aria-hidden="true" className="size-5 text-emerald-600" strokeWidth={1.8} />
            <span className="flex flex-col gap-0.5">
              <span className="text-xs text-foreground/50">{label}</span>
              <span className="font-secondary text-lg font-medium">{value}</span>
            </span>
          </div>
        ))}
      </section>

      <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <section className="flex flex-col gap-5 border-b px-6 py-8 sm:px-9 lg:border-b-0 lg:border-r lg:px-12">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-600">Concept map</p>
            <h2 className="font-secondary text-2xl font-medium">What is solid and what comes next</h2>
          </div>
          <ol className="flex flex-col divide-y">
            {sortedConcepts.map((concept) => {
              const score = concept.score ?? 0;
              return (
                <li className="flex flex-col gap-3 py-4" key={concept.id ?? concept.name}>
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="font-medium">{concept.name}</span>
                      {concept.description ? (
                        <span className="text-sm leading-5 text-foreground/55">{concept.description}</span>
                      ) : null}
                    </span>
                    <span className={cn(
                      "shrink-0 text-xs font-medium",
                      concept.state === "demonstrated" && "text-emerald-700",
                      concept.state === "developing" && "text-orange-600",
                      concept.state === "unexplored" && "text-foreground/45",
                    )}>
                      {conceptStateLabel[concept.state]} · {score}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted" aria-label={`${concept.name} ${score}%`}>
                    <div
                      className={cn(
                        "h-full transition-[width] duration-500 motion-reduce:transition-none",
                        concept.state === "demonstrated" ? "bg-emerald-500" : "bg-orange-400",
                      )}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="flex flex-col">
          <section className="border-b px-6 py-8 sm:px-9">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-600">Strengths</p>
              <h2 className="font-secondary text-xl font-medium">Evidence you demonstrated</h2>
            </div>
            <EvidenceList
              emptyMessage="Keep explaining ideas in your own words to build strong evidence."
              evidence={strengths}
              tone="strength"
            />
          </section>

          <section className="border-b px-6 py-8 sm:px-9">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-orange-600">Practice next</p>
              <h2 className="font-secondary text-xl font-medium">Ideas to revisit</h2>
            </div>
            <EvidenceList
              emptyMessage="No misconceptions or uncertain claims were identified."
              evidence={revisits}
              tone="revisit"
            />
            {workspace.openQuestions.length > 0 ? (
              <div className="flex flex-col gap-3 border-l-2 border-orange-400 pl-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-orange-700">Open questions</p>
                <ul className="flex flex-col gap-2 text-sm leading-5 text-foreground/65">
                  {workspace.openQuestions.slice(0, 4).map((question) => (
                    <li key={question.id}>{question.text}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <footer className="flex flex-col gap-3 border-t bg-background px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-9 lg:px-12">
        <p className="text-sm text-foreground/55">
          Your completed concepts are now available in the dashboard practice lab.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onReview} type="button" variant="outline">
            <RotateCcw aria-hidden="true" data-icon="inline-start" />
            Review conversation
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              Go to dashboard
              <ArrowRight aria-hidden="true" data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default SessionCompletionSummary;
