"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowUp,
  Check,
  ChevronRight,
  FileText,
  LoaderCircle,
  Minus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SessionCompletionSummary from "@/components/common/SessionCompletionSummary";
import { readApiResponse } from "@/lib/api-response";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type {
  Concept,
  PersistedTurn,
  SessionTurn,
  SessionWorkspaceProps,
  UnderstandingMirrorProps,
  WorkspaceResponse,
} from "@/types/session";
import { cn } from "@/utils/ui/cn";

const EvidenceStateIcon = ({ kind }: { kind: "supports" | "contradicts" | "uncertain" }) => {
  if (kind === "supports") {
    return (
      <span className="grid size-5 place-items-center bg-emerald-500 text-white aspect-square">
        <Check aria-hidden="true" className="size-3" strokeWidth={2.5} />
      </span>
    );
  }

  if (kind === "contradicts") {
    return (
      <span className="grid size-5 place-items-center bg-red-500 text-white aspect-square">
        <X aria-hidden="true" className="size-3" strokeWidth={2.5} />
      </span>
    );
  }

  return (
    <span className="grid size-5 place-items-center border border-orange-400 bg-orange-50 text-orange-600 aspect-square">
      <Minus aria-hidden="true" className="size-3" strokeWidth={2.5} />
    </span>
  );
};

const UnderstandingMirror = ({
  concepts,
  evidence,
  openQuestions,
  summary,
  understandingScore,
}: UnderstandingMirrorProps) => {
  const positiveEvidenceCount = evidence.filter((item) => item.kind === "supports").length;
  const needsWorkCount = evidence.filter((item) => item.kind === "contradicts").length;
  const statusLabel =
    understandingScore >= 80
      ? "Strong"
      : understandingScore >= 50
        ? "Developing"
        : "Building";
  const statusDescription =
    understandingScore >= 80
      ? "Your explanations consistently show the important relationships in this material."
      : understandingScore >= 50
        ? "You have the core ideas, with a few relationships still becoming consistent."
        : "You are establishing the core ideas. Keep explaining them in your own words.";
  const insightItems = [
    statusDescription,
    summary ?? (
      evidence.length > 0
        ? `${positiveEvidenceCount} responses showed strong understanding; ${needsWorkCount} should be revisited.`
        : "Your next evaluated response will add specific evidence to this mirror."
    ),
    openQuestions[0] ? `Next focus: ${openQuestions[0].text}` : null,
  ].filter((item): item is string => Boolean(item));

  return (
  <aside className="flex min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden bg-background lg:h-full lg:border-l">
    <div className="flex flex-col gap-4 border-b px-5 py-6 sm:px-7">
      <div className="flex items-end justify-between gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/50">
          Understanding mirror
        </p>
        <p className="font-secondary text-xl font-medium">{statusLabel}</p>
      </div>
      <div className="flex items-baseline gap-1 text-orange-600">
        <span className="font-secondary text-5xl font-medium tabular-nums">
          {understandingScore}
        </span>
        <span className="text-sm font-medium">%</span>
      </div>
      </div>
      <div className="flex flex-col gap-3">
        <ul className="flex list-disc flex-col gap-2 pl-4 text-sm leading-5 text-foreground/65">
          {insightItems.map((item) => <li className="wrap-anywhere" key={item}>{item}</li>)}
        </ul>
        <div className="h-1.5 w-full bg-muted" aria-label={`Estimated understanding ${understandingScore}%`}>
          <div className="h-full bg-emerald-500 transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${understandingScore}%` }} />
        </div>
        <p className="text-xs text-foreground/50">
          Estimate based on {evidence.length} evaluated {evidence.length === 1 ? "response" : "responses"} across {concepts.length} {concepts.length === 1 ? "concept" : "concepts"}.
        </p>
      </div>
    </div>

    <div className="min-h-0 overflow-y-auto">
      <section className="flex flex-col gap-5 border-b px-5 py-6 sm:px-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-secondary text-lg font-medium">What you have shown</h2>
          <span className="text-xs text-emerald-600">
            {positiveEvidenceCount} strong · {needsWorkCount} revisit
          </span>
        </div>
        <ol className="flex flex-col">
          {evidence.map((item, index) => (
            <li className="relative flex min-h-14 items-start gap-3 animate-in fade-in slide-in-from-right-2 duration-300 py-2" key={item.id}>
              {index < evidence.length - 1 ? (
                <span className="absolute left-2.5 top-7 h-[calc(100%-0.25rem)] w-px bg-border" />
              ) : null}
              <EvidenceStateIcon kind={item.kind} />
              <span className="flex min-w-0 flex-col gap-0.5 text-sm leading-5">
                <span className="font-medium">{item.conceptName}</span>
                <span className="text-foreground/60">{item.claim}</span>
              </span>
            </li>
          ))}
          {evidence.length === 0 ? (
            <li className="text-sm text-foreground/45">Your evaluated responses will appear here.</li>
          ) : null}
        </ol>
      </section>

      <section className="flex flex-col gap-4 border-b px-5 py-6 sm:px-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-secondary text-lg font-medium">Questions to clear up</h2>
          <span className="text-xs text-red-600">
            {openQuestions.length} {openQuestions.length === 1 ? "gap" : "gaps"}
          </span>
        </div>
        <ul className="flex flex-col gap-4 text-sm leading-relaxed text-foreground/65">
          {openQuestions.map((question) => (
            <li className="grid grid-cols-[1rem_1fr] items-start gap-3" key={question.id}>
              <ChevronRight aria-hidden="true" className="size-4 text-red-500" />
              <span className="text-trim min-w-0 wrap-anywhere">{question.text}</span>
            </li>
          ))}
          {openQuestions.length === 0 ? (
            <li className="text-foreground/45">No unresolved questions yet.</li>
          ) : null}
        </ul>
      </section>

    </div>
  </aside>
  );
};

const toSessionTurn = (turn: PersistedTurn): SessionTurn => ({
  id: turn.id,
  speaker: turn.role === "assistant" ? "AI" : "You",
  label: turn.interactionType?.toUpperCase() as SessionTurn["label"],
  content: turn.content,
});

const SessionWorkspace = ({
  filename,
  pageCount,
  learningSessionId,
}: SessionWorkspaceProps) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<"explain" | "mirror">("explain");
  const [sessionStatus, setSessionStatus] = useState<WorkspaceResponse["status"]>("active");
  const [turns, setTurns] = useState<SessionTurn[]>([]);
  const [documentName, setDocumentName] = useState(filename ?? "Learning session");
  const [documentPageCount, setDocumentPageCount] = useState(pageCount);
  const [activeConceptName, setActiveConceptName] = useState("");
  const [understandingScore, setUnderstandingScore] = useState(0);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [evidence, setEvidence] = useState<WorkspaceResponse["evidence"]>([]);
  const [openQuestions, setOpenQuestions] = useState<WorkspaceResponse["openQuestions"]>([]);
  const [summary, setSummary] = useState<string>();
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [completedWorkspace, setCompletedWorkspace] = useState<WorkspaceResponse | null>(null);
  const [showCompletionSummary, setShowCompletionSummary] = useState(false);

  const applyWorkspace = (workspace: WorkspaceResponse) => {
    setSessionStatus(workspace.status);
    setDocumentName(workspace.document.filename);
    setDocumentPageCount(workspace.document.pageCount);
    setTurns(workspace.turns.map(toSessionTurn));
    setActiveConceptName(workspace.activeConceptName ?? "");
    setUnderstandingScore(workspace.understandingScore ?? 0);
    setConcepts(workspace.concepts ?? []);
    setEvidence(workspace.evidence ?? []);
    setOpenQuestions(workspace.openQuestions ?? []);
    setSummary(workspace.summary);
    if (workspace.status === "completed") {
      setCompletedWorkspace(workspace);
      setShowCompletionSummary(true);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [isSubmitting, turns]);

  useEffect(() => {
    const controller = new AbortController();

    const hydrateSession = async () => {
      try {
        const sessionResponse = await fetch(
          `/api/learning-sessions/${encodeURIComponent(learningSessionId)}`,
          { signal: controller.signal },
        );
        const body = await readApiResponse(
          sessionResponse,
          "The saved session could not be loaded.",
        );

        applyWorkspace(body as WorkspaceResponse);
      } catch (error) {
        if (!controller.signal.aborted) {
          toast.error(
            error instanceof Error
              ? error.message
              : "The saved session could not be loaded.",
          );
        }
      }
    };

    void hydrateSession();

    return () => controller.abort();
  }, [learningSessionId]);

  const submitResponse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = response.trim();
    if (!content || isSubmitting) return;

    setIsSubmitting(true);
    const requestId = crypto.randomUUID();
    const optimisticTurn: SessionTurn = {
      id: `optimistic:${requestId}`,
      speaker: "You",
      content,
      isOptimistic: true,
    };
    setTurns((current) => [...current, optimisticTurn]);
    setResponse("");

    try {
      const turnResponse = await fetch(
        `/api/learning-sessions/${encodeURIComponent(learningSessionId)}/turns`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, requestId }),
        },
      );
      const body = (await readApiResponse(
        turnResponse,
        "Your response could not be saved.",
      )) as { workspace?: WorkspaceResponse };

      if (!body.workspace) {
        throw new Error("The updated session state was not returned.");
      }
      applyWorkspace(body.workspace as WorkspaceResponse);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Your response could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const endSession = async () => {
    if (isEnding) return;
    setIsEnding(true);

    try {
      const endResponse = await fetch(
        `/api/learning-sessions/${encodeURIComponent(learningSessionId)}/complete`,
        { method: "POST" },
      );
      const body = (await readApiResponse(
        endResponse,
        "The session could not be ended.",
      )) as { workspace?: WorkspaceResponse };
      if (!body.workspace) {
        throw new Error("The completed session summary was not returned.");
      }
      applyWorkspace(body.workspace);
      setIsEnding(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The session could not be ended.");
      setIsEnding(false);
    }
  };

  const submitOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  const demonstratedCount = new Set(
    evidence
      .filter((item) => item.kind === "supports")
      .map((item) => item.conceptName.trim().toLocaleLowerCase()),
  ).size;

  if (completedWorkspace && showCompletionSummary) {
    return (
      <SessionCompletionSummary
        onReview={() => setShowCompletionSummary(false)}
        workspace={completedWorkspace}
      />
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden border bg-background shadow-[7px_7px_0_#d1fae5] lg:flex lg:h-[calc(100dvh-9.5rem)] lg:flex-col">
      <header className="flex flex-col border-b">
        <div className="flex min-w-0 max-w-full items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <FileText aria-hidden="true" className="size-4 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{documentName}</p>
              <p className="text-xs text-foreground/75">
                {documentPageCount ?? "-"} {documentPageCount === 1 ? "page" : "pages"}
                {activeConceptName ? ` · Current concept: ${activeConceptName}` : ""}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            {evidence.length > 0 ? (
              <div className="hidden items-center gap-3 sm:flex">
                <span className="text-xs text-foreground/75">
                  {demonstratedCount} of {concepts.length} understood
                </span>
                <div className="h-1.5 w-24 bg-muted" aria-hidden="true">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${understandingScore}%` }}
                  />
                </div>
              </div>
            ) : null}
            {sessionStatus === "active" ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button disabled={isEnding || isSubmitting} size="sm" variant="outline">
                    {isEnding
                      ? "Ending session..."
                      : isSubmitting
                        ? "Finishing response..."
                        : "End session"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-secondary text-2xl font-medium">
                      End this session?
                    </DialogTitle>
                    <DialogDescription>
                      Your current progress will become available for practice on the dashboard.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button disabled={isEnding} variant="outline">Keep learning</Button>
                    </DialogClose>
                    <Button disabled={isEnding} onClick={() => void endSession()}>
                      {isEnding ? (
                        <>
                          <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" data-icon="inline-start" />
                          Ending session...
                        </>
                      ) : "End session"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <div className="flex items-center gap-2">
                {completedWorkspace ? (
                  <Button onClick={() => setShowCompletionSummary(true)} size="sm" variant="outline">
                    View summary
                  </Button>
                ) : null}
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard">Return to dashboard</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:hidden" role="tablist" aria-label="Session view">
          {(["explain", "mirror"] as const).map((view) => (
            <button
              aria-controls={`${view}-panel`}
              aria-selected={activeView === view}
              className={cn(
                "border-t px-4 py-3 text-sm font-medium capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500",
                activeView === view
                  ? "border-b-2 border-b-emerald-500 text-foreground"
                  : "text-foreground/50",
              )}
              id={`${view}-tab`}
              key={view}
              onClick={() => setActiveView(view)}
              role="tab"
              type="button"
            >
              {view}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 min-w-0 w-full max-w-full lg:grid lg:flex-1 lg:grid-cols-[minmax(0,1.65fr)_minmax(19rem,1fr)]">
        <section
          aria-labelledby="explain-tab"
          className={cn(
            "min-h-152 min-w-0 w-full max-w-full flex-col overflow-hidden lg:h-full lg:min-h-0",
            activeView === "explain" ? "flex" : "hidden lg:flex",
          )}
          id="explain-panel"
          role="tabpanel"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-8 overflow-x-hidden overflow-y-auto px-5 py-8 sm:px-8 lg:px-10">
            {turns.map((turn) => (
              <article
                className={cn(
                  "grid min-w-0 max-w-full gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:items-start sm:gap-5",
                  turn.isOptimistic && "opacity-75",
                )}
                key={turn.id}
              >
                <div className="flex items-start gap-2">
                  <span className={cn(
                    "text-trim text-xs font-medium uppercase tracking-[0.14em]",
                    turn.speaker === "AI" ? "mt-0.5 text-emerald-600" : "mt-1.5 text-foreground",
                  )}>
                    {turn.label ?? turn.speaker}
                  </span>
                </div>
                <p className={cn(
                  "text-trim min-w-0 max-w-2xl wrap-anywhere leading-7",
                  turn.speaker === "AI"
                    ? "font-secondary text-xl sm:leading-8"
                    : "text-foreground/75",
                )}>
                  {turn.content}
                </p>
              </article>
            ))}
            {isSubmitting ? (
              <article
                aria-label="AI is thinking"
                className="grid gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:grid-cols-[5.5rem_1fr] sm:items-start sm:gap-5"
                role="status"
              >
                <span className="text-trim text-xs font-medium uppercase tracking-[0.14em] text-emerald-600">
                  AI
                </span>
                <div className="flex h-4 items-center gap-1.5" aria-hidden="true">
                  {[0, 1, 2].map((dot) => (
                    <span
                      className="size-1 rounded-full animate-bounce bg-emerald-500 motion-reduce:animate-pulse"
                      key={dot}
                      style={{ animationDelay: `${dot * 140}ms` }}
                    />
                  ))}
                </div>
              </article>
            ) : null}
            <div ref={chatEndRef} />
          </div>

          {sessionStatus === "active" ? (
            <form className="flex min-w-0 max-w-full shrink-0 flex-col gap-2 border-t bg-background p-4 sm:p-6" onSubmit={submitResponse}>
              <div className="min-w-0 max-w-full border border-foreground/25 bg-background focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                <label className="sr-only" htmlFor="explanation-response">Explain your understanding</label>
                <textarea
                  className="min-h-24 w-full max-w-full resize-none bg-transparent px-4 py-3 text-[0.98rem] leading-6 outline-none placeholder:text-foreground/50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting || isEnding}
                  id="explanation-response"
                  onChange={(event) => setResponse(event.target.value)}
                  onKeyDown={submitOnEnter}
                  placeholder={isSubmitting ? "Waiting for the next question..." : "Explain what happens next..."}
                  value={response}
                />
                <div className="flex items-center justify-end gap-3 border-t px-3 py-2">
                  <Button
                    aria-label={isSubmitting ? "Sending explanation" : "Send explanation"}
                    disabled={!response.trim() || isSubmitting || isEnding}
                    size="icon-sm"
                    type="submit"
                    title={isSubmitting ? "Sending explanation" : "Send explanation"}
                  >
                    {isSubmitting ? (
                      <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
                    ) : (
                      <ArrowUp aria-hidden="true" />
                    )}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex shrink-0 items-center justify-between gap-4 border-t bg-emerald-50 p-4 sm:p-6">
              <p className="text-sm text-emerald-800">This session is complete. Your practice concepts are ready on the dashboard.</p>
              <Button asChild size="sm"><Link href="/dashboard">Practice concepts</Link></Button>
            </div>
          )}
        </section>

        <div
          aria-labelledby="mirror-tab"
          className={cn("min-h-0", activeView === "mirror" ? "block" : "hidden lg:block")}
          id="mirror-panel"
          role="tabpanel"
        >
          <UnderstandingMirror
            concepts={concepts}
            evidence={evidence}
            openQuestions={openQuestions}
            summary={summary}
            understandingScore={understandingScore}
          />
        </div>
      </div>
    </div>
  );
};

export default SessionWorkspace;
