"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowUp,
  Check,
  ChevronRight,
  FileText,
  LoaderCircle,
  Mic,
  Minus,
  Square,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SessionCompletionSummary from "@/components/common/SessionCompletionSummary";
import {
  MAX_SESSION_ACTIVE_DURATION_MS,
  MAX_SESSION_INPUT_LENGTH,
  MAX_VOICE_DURATION_SECONDS,
} from "@/constants/session-input";
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
    <span className="grid size-5 place-items-center border border-orange-400 bg-orange-100 text-orange-700 aspect-square dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
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
  <aside
    aria-label="Learning mirror content"
    className="h-full min-h-0 min-w-0 w-full max-w-full touch-pan-y overscroll-contain overflow-y-auto bg-background lg:border-l"
    role="region"
    tabIndex={0}
  >
    <div className="flex flex-col gap-4 border-b px-5 py-6 sm:px-7">
      <div className="flex items-end justify-between gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/50">
          Learning mirror
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

    <div>
      <section className="flex flex-col gap-5 border-b px-5 py-6 sm:px-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-secondary text-lg font-medium">What I understood</h2>
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
          <h2 className="font-secondary text-lg font-medium">What I am still missing</h2>
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

const interactionLabel = {
  explain: "LISTENING",
  probe: "CLARIFYING",
  why: "FOLLOWING",
  connect: "CONNECTING",
  apply: "TRYING IT",
  challenge: "STRESS TESTING",
} as const;

const RECORDING_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/webm",
  "audio/ogg;codecs=opus",
];

const formatRecordingTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
};

const recordingExtension = (contentType: string) => {
  if (contentType.includes("mp4")) return "m4a";
  if (contentType.includes("ogg")) return "ogg";
  if (contentType.includes("wav")) return "wav";
  return "webm";
};

const toSessionTurn = (turn: PersistedTurn): SessionTurn => ({
  id: turn.id,
  speaker: turn.role === "assistant" ? "AI learner" : "You",
  label: turn.role === "learner"
    ? "YOU"
    : turn.interactionType
      ? interactionLabel[turn.interactionType]
      : "LISTENING",
  content: turn.content,
});

const SessionWorkspace = ({
  filename,
  initialView = "workspace",
  pageCount,
  learningSessionId,
}: SessionWorkspaceProps) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef(0);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const discardRecordingRef = useRef(false);
  const activeDurationMsRef = useRef(0);
  const activeSessionStartedAtRef = useRef<number | null>(null);
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
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
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

  const latestAiTurn = [...turns].reverse().find((turn) => turn.speaker === "AI learner");
  const hasAiTurn = Boolean(latestAiTurn);
  const showAiThinkingBubble = isSubmitting || (isHydrating && !latestAiTurn);
  const aiPendingLabel = isSubmitting ? "AI learner is thinking" : "AI learner is listening";
  const aiPendingHeading = isSubmitting ? "THINKING" : "LISTENING";
  const getActiveDurationMs = useCallback(() => {
    const activeElapsedMs = activeSessionStartedAtRef.current === null
      ? 0
      : Date.now() - activeSessionStartedAtRef.current;
    return Math.min(MAX_SESSION_ACTIVE_DURATION_MS, activeDurationMsRef.current + activeElapsedMs);
  }, []);

  useEffect(() => {
    if (!showAiThinkingBubble && !hasAiTurn) return;

    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [hasAiTurn, latestAiTurn?.content, latestAiTurn?.id, showAiThinkingBubble]);

  useEffect(() => {
    const controller = new AbortController();
    setIsHydrating(true);

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

        const workspace = body as WorkspaceResponse;
        activeDurationMsRef.current = workspace.activeDurationMs ?? 0;
        applyWorkspace(workspace);
        if (initialView === "summary") {
          setCompletedWorkspace(workspace);
          setShowCompletionSummary(true);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          toast.error(
            error instanceof Error
              ? error.message
              : "The saved session could not be loaded.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsHydrating(false);
      }
    };

    void hydrateSession();

    return () => controller.abort();
  }, [initialView, learningSessionId]);

  useEffect(() => {
    if (isHydrating || sessionStatus !== "active" || showCompletionSummary) return;

    const startTracking = () => {
      if (document.visibilityState !== "hidden" && activeSessionStartedAtRef.current === null) {
        activeSessionStartedAtRef.current = Date.now();
      }
    };
    const pauseTracking = () => {
      activeDurationMsRef.current = getActiveDurationMs();
      activeSessionStartedAtRef.current = null;
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        pauseTracking();
      } else {
        startTracking();
      }
    };

    startTracking();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      pauseTracking();
    };
  }, [getActiveDurationMs, isHydrating, sessionStatus, showCompletionSummary]);

  useEffect(() => () => {
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    const recorder = mediaRecorderRef.current;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      if (recorder.state !== "inactive") recorder.stop();
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const clearRecordingTimers = () => {
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    recordingIntervalRef.current = null;
    recordingTimeoutRef.current = null;
  };

  const transcribeRecording = async (blob: Blob, durationSeconds: number) => {
    setIsTranscribing(true);
    const form = new FormData();
    const extension = recordingExtension(blob.type);
    form.set("file", blob, `teaching.${extension}`);
    form.set("durationSeconds", String(durationSeconds));

    try {
      const transcriptionResponse = await fetch(
        `/api/learning-sessions/${encodeURIComponent(learningSessionId)}/transcribe`,
        { method: "POST", body: form },
      );
      const body = (await readApiResponse(
        transcriptionResponse,
        "The recording could not be transcribed.",
      )) as { text?: string; truncated?: boolean };
      if (!body.text) throw new Error("The transcription was empty.");

      setResponse((current) => {
        const combined = current.trim() ? `${current.trim()}\n\n${body.text}` : body.text!;
        return combined.slice(0, MAX_SESSION_INPUT_LENGTH);
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The recording could not be transcribed.",
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const stopRecording = (discard = false) => {
    discardRecordingRef.current = discard;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  };

  const startRecording = async () => {
    if (isRecording || isTranscribing || isSubmitting || isEnding) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Voice recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = RECORDING_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];
      recordingStartedAtRef.current = Date.now();
      discardRecordingRef.current = false;
      setRecordingSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        clearRecordingTimers();
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecording(false);

        const elapsedSeconds = Math.min(
          MAX_VOICE_DURATION_SECONDS,
          Math.max(1, (Date.now() - recordingStartedAtRef.current) / 1_000),
        );
        const blob = new Blob(recordingChunksRef.current, {
          type: recorder.mimeType || recordingChunksRef.current[0]?.type || "audio/webm",
        });
        recordingChunksRef.current = [];
        if (!discardRecordingRef.current && blob.size > 0) {
          void transcribeRecording(blob, elapsedSeconds);
        }
      };

      recorder.start(1_000);
      setIsRecording(true);
      recordingIntervalRef.current = setInterval(() => {
        const elapsed = Math.min(
          MAX_VOICE_DURATION_SECONDS,
          Math.floor((Date.now() - recordingStartedAtRef.current) / 1_000),
        );
        setRecordingSeconds(elapsed);
      }, 250);
      recordingTimeoutRef.current = setTimeout(
        () => stopRecording(),
        MAX_VOICE_DURATION_SECONDS * 1_000,
      );
    } catch {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      toast.error("Microphone access is required to record a voice response.");
    }
  };

  const submitResponse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = response.trim();
    if (!content || isSubmitting) return;

    setIsSubmitting(true);
    const requestId = crypto.randomUUID();
    const optimisticTurn: SessionTurn = {
      id: `optimistic:${requestId}`,
      label: "YOU",
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
    const activeDurationMs = getActiveDurationMs();
    activeDurationMsRef.current = activeDurationMs;
    activeSessionStartedAtRef.current = null;

    try {
      const endResponse = await fetch(
        `/api/learning-sessions/${encodeURIComponent(learningSessionId)}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activeDurationMs }),
        },
      );
      const body = (await readApiResponse(
        endResponse,
        "The session could not be ended.",
      )) as { workspace?: WorkspaceResponse };
      if (!body.workspace) {
        throw new Error("The completed session summary was not returned.");
      }
      applyWorkspace(body.workspace);
      activeDurationMsRef.current = body.workspace.activeDurationMs ?? activeDurationMs;
      setCompletedWorkspace(body.workspace);
      setShowCompletionSummary(true);
      setIsEnding(false);
    } catch (error) {
      if (document.visibilityState !== "hidden") {
        activeSessionStartedAtRef.current = Date.now();
      }
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
  const demonstratedProgress = concepts.length > 0
    ? Math.min(100, Math.round((demonstratedCount / concepts.length) * 100))
    : 0;
  const canCompleteSession =
    concepts.length > 0 && concepts.every((concept) => concept.state === "demonstrated");

  if (completedWorkspace && showCompletionSummary) {
    return (
      <SessionCompletionSummary
        onReview={() => setShowCompletionSummary(false)}
        workspace={completedWorkspace}
      />
    );
  }

  return (
  <div className="flex h-[calc(100dvh-7.5rem)] w-full min-w-0 max-w-full flex-col overflow-hidden border bg-background shadow-[7px_7px_0_#d1fae5] sm:h-[calc(100dvh-8.5rem)] dark:shadow-[7px_7px_0_#064e3b]">
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
                <div className="h-1.5 w-24 bg-muted">
                  <div
                    aria-label={`${demonstratedProgress}% concepts understood`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={demonstratedProgress}
                    className="h-full bg-emerald-500"
                    role="progressbar"
                    style={{ width: `${demonstratedProgress}%` }}
                  />
                </div>
              </div>
            ) : null}
            {sessionStatus === "active" ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button disabled={isEnding || isSubmitting || isRecording || isTranscribing} size="sm" variant="outline">
                    {isEnding
                      ? canCompleteSession
                        ? "Completing session..."
                        : "Saving progress..."
                      : isSubmitting
                        ? "Finishing response..."
                        : canCompleteSession
                          ? "Complete session"
                          : "Save and leave"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-secondary text-2xl font-medium">
                      {canCompleteSession ? "Complete this session?" : "Save your progress?"}
                    </DialogTitle>
                    <DialogDescription>
                      {canCompleteSession
                        ? "All concepts are demonstrated. This session will be added to practice and mastery."
                        : "This session will stay in progress so you can resume from where you left off."}
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
                          {canCompleteSession ? "Completing..." : "Saving..."}
                        </>
                      ) : canCompleteSession ? "Complete session" : "Save and leave"}
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
              {view === "explain" ? "Teach" : "Learning mirror"}
            </button>
          ))}
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 w-full max-w-full flex-1 lg:grid lg:grid-cols-[minmax(0,1.65fr)_minmax(19rem,1fr)]">
        <section
          aria-labelledby="explain-tab"
          className={cn(
            "min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden lg:h-full",
            activeView === "explain" ? "flex" : "hidden lg:flex",
          )}
          id="explain-panel"
          role="tabpanel"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-8 overflow-x-hidden overflow-y-auto px-5 py-8 sm:px-8 lg:px-10">
            {turns.map((turn) => (
              <article
                className={cn(
                  "grid min-w-0 max-w-full gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-start sm:gap-6",
                  turn.isOptimistic && "opacity-75",
                )}
                key={turn.id}
              >
                <div className="flex min-w-0 items-start gap-2">
                  <span className={cn(
                    "block max-w-full truncate text-xs font-medium uppercase tracking-[0.14em]",
                    turn.speaker === "AI learner" ? "mt-0.5 text-emerald-600" : "mt-1.5 text-foreground",
                  )}>
                    {turn.label ?? turn.speaker}
                  </span>
                </div>
                <p className={cn(
                  "text-trim min-w-0 max-w-2xl wrap-anywhere leading-7",
                  turn.speaker === "AI learner"
                    ? "font-secondary text-xl sm:leading-8"
                    : "text-foreground/75",
                )}>
                  {turn.content}
                </p>
              </article>
            ))}
            {showAiThinkingBubble ? (
              <article
                aria-label={aiPendingLabel}
                className="grid gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-start sm:gap-6"
                role="status"
              >
                <span className="text-trim text-xs font-medium uppercase tracking-[0.14em] text-emerald-600">
                  {aiPendingHeading}
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
            <form className="flex min-w-0 max-w-full shrink-0 flex-col gap-2 border-t bg-background p-3 sm:p-4" onSubmit={submitResponse}>
              <div className={cn(
                "flex min-h-14 items-center justify-between gap-3 border px-3 py-2",
                isRecording
                  ? "border-red-400 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
                  : "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50",
              )}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className={cn(
                    "grid size-8 shrink-0 place-items-center",
                    isRecording ? "bg-red-500 text-white" : "bg-emerald-500 text-white",
                  )}>
                    {isTranscribing ? (
                      <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
                    ) : isRecording ? (
                      <span className="size-2 animate-pulse rounded-full bg-white motion-reduce:animate-none" />
                    ) : (
                      <Mic aria-hidden="true" className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-5">
                      {isTranscribing ? "Transcribing voice" : isRecording ? "Recording voice" : "Voice response"}
                    </p>
                    <p className="text-xs tabular-nums text-foreground/60" aria-live="polite">
                      {formatRecordingTime(recordingSeconds)} / {formatRecordingTime(MAX_VOICE_DURATION_SECONDS)}
                    </p>
                  </div>
                </div>

                {isRecording ? (
                  <div className="flex items-center gap-2">
                    <Button
                      aria-label="Discard voice recording"
                      onClick={() => stopRecording(true)}
                      size="icon-sm"
                      title="Discard voice recording"
                      type="button"
                      variant="ghost"
                    >
                      <X aria-hidden="true" />
                    </Button>
                    <Button onClick={() => stopRecording()} size="sm" type="button" variant="destructive">
                      <Square aria-hidden="true" data-icon="inline-start" />
                      Stop
                    </Button>
                  </div>
                ) : (
                  <Button
                    disabled={isTranscribing || isSubmitting || isEnding}
                    onClick={() => void startRecording()}
                    size="sm"
                    type="button"
                  >
                    <Mic aria-hidden="true" data-icon="inline-start" />
                    Record
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-foreground/45">
                <span className="h-px flex-1 bg-border" />
                Or type
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="min-w-0 max-w-full border border-foreground/25 bg-background focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                <label className="sr-only" htmlFor="explanation-response">Teach the AI learner</label>
                <textarea
                  className="min-h-16 w-full max-w-full resize-none bg-transparent px-3 py-2 text-sm leading-5 outline-none placeholder:text-foreground/50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting || isEnding || isRecording || isTranscribing}
                  id="explanation-response"
                  maxLength={MAX_SESSION_INPUT_LENGTH}
                  onChange={(event) => setResponse(event.target.value)}
                  onKeyDown={submitOnEnter}
                  placeholder={isSubmitting ? "The AI learner is thinking..." : isTranscribing ? "Turning your voice into text..." : "Teach the next idea in your own words..."}
                  value={response}
                />
                <div className="flex items-center justify-between gap-3 border-t p-3">
                  <span className="text-xs tabular-nums text-foreground/50">
                    {response.length.toLocaleString()} / {MAX_SESSION_INPUT_LENGTH.toLocaleString()}
                  </span>
                  <Button
                    aria-label={isSubmitting ? "Sending explanation" : "Send explanation"}
                    disabled={!response.trim() || isSubmitting || isEnding || isRecording || isTranscribing}
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
            <div className="flex shrink-0 items-center justify-between gap-4 border-t bg-emerald-50 p-4 sm:p-6 dark:bg-emerald-950/50">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">This session is complete. Your practice concepts are ready on the dashboard.</p>
              <Button asChild size="sm"><Link href="/dashboard">Practice concepts</Link></Button>
            </div>
          )}
        </section>

        <div
          aria-labelledby="mirror-tab"
          className={cn(
            "min-h-0 flex-1 overflow-hidden",
            activeView === "mirror" ? "block" : "hidden lg:block",
          )}
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
