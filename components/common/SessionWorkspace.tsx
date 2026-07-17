"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  FileText,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

type SessionWorkspaceProps = {
  filename: string;
  pageCount: number;
};

type Turn = {
  id: number;
  speaker: "AI" | "You";
  label?: "EXPLAIN" | "PROBE" | "WHY" | "CONNECT" | "APPLY" | "CHALLENGE";
  content: string;
};

const INITIAL_TURNS: Turn[] = [
  {
    id: 1,
    speaker: "AI",
    label: "EXPLAIN",
    content:
      "In your own words, what does virtual memory help a computer do? Focus on the problem it solves rather than giving a textbook definition.",
  },
  {
    id: 2,
    speaker: "You",
    content:
      "Virtual memory lets a program behave as though it has more memory than the machine physically has. It gives each process its own address space and moves data between RAM and disk when needed.",
  },
  {
    id: 3,
    speaker: "AI",
    label: "PROBE",
    content:
      "Imagine a program needs something that is not currently in RAM. What happens next, and which part of the computer handles it?",
  },
];

const CONCEPTS = [
  { name: "Address spaces", state: "demonstrated" },
  { name: "Paging", state: "demonstrated" },
  { name: "Page faults", state: "developing" },
  { name: "TLB", state: "unexplored" },
  { name: "Replacement", state: "unexplored" },
  { name: "Thrashing", state: "unexplored" },
] as const;

const HINTS = [
  "Start with the page table. How does the processor know the page is not in RAM?",
  "The processor pauses the program and asks the operating system for help. What must the operating system do before the program can continue?",
];

const FIXTURE_RESPONSE: Turn = {
  id: 0,
  speaker: "AI",
  label: "WHY",
  content:
    "Once the missing page is loaded into RAM, why does the computer need to try the interrupted instruction again?",
};

const ConceptStateIcon = ({ state }: { state: (typeof CONCEPTS)[number]["state"] }) => {
  if (state === "demonstrated") {
    return (
      <span className="grid size-5 place-items-center bg-emerald-500 text-white">
        <Check aria-hidden="true" className="size-3" strokeWidth={2.5} />
      </span>
    );
  }

  if (state === "developing") {
    return (
      <span className="grid size-5 place-items-center border border-orange-500 bg-orange-50">
        <span className="size-1.5 bg-orange-500" />
      </span>
    );
  }

  return (
    <span className="grid size-5 place-items-center border border-foreground/20 bg-background">
      <Circle aria-hidden="true" className="size-1.5 fill-foreground/20 text-foreground/50" />
    </span>
  );
};

const UnderstandingMirror = ({ confidence, setConfidence }: {
  confidence: number;
  setConfidence: (value: number) => void;
}) => (
  <aside className="flex min-h-0 flex-col bg-background lg:h-full lg:border-l">
    <div className="flex items-end justify-between gap-5 border-b px-5 py-6 sm:px-7">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/50">
          Understanding mirror
        </p>
        <p className="font-secondary text-xl font-medium">Developing</p>
      </div>
      <div className="flex items-baseline gap-1 text-orange-600">
        <span className="font-secondary text-5xl font-medium tabular-nums">78</span>
        <span className="text-sm font-medium">%</span>
      </div>
    </div>

    <div className="min-h-0 overflow-y-auto">
      <section className="flex flex-col gap-5 border-b px-5 py-6 sm:px-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-secondary text-lg font-medium">What you have shown</h2>
          <span className="text-xs text-emerald-600">2 of 6 understood</span>
        </div>
        <ol className="flex flex-col">
          {CONCEPTS.map((concept, index) => (
            <li className="relative flex min-h-10 items-start gap-3" key={concept.name}>
              {index < CONCEPTS.length - 1 ? (
                <span className="absolute left-2.5 top-5 h-[calc(100%-0.25rem)] w-px bg-border" />
              ) : null}
              <ConceptStateIcon state={concept.state} />
              <span className={cn(
                "text-sm leading-5",
                concept.state === "unexplored" && "text-foreground/50",
              )}>
                {concept.name}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-4 border-b px-5 py-6 sm:px-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-secondary text-lg font-medium">Questions to clear up</h2>
          <span className="text-xs text-red-600">2 gaps</span>
        </div>
        <ul className="flex flex-col gap-4 text-sm leading-relaxed text-foreground/65">
          <li className="grid grid-cols-[1rem_1fr] items-center gap-3">
            <ChevronRight aria-hidden="true" className="size-4 text-red-500" />
            <span className="text-trim">How does the computer know a page is not in RAM?</span>
          </li>
          <li className="grid grid-cols-[1rem_1fr] items-center gap-3">
            <ChevronRight aria-hidden="true" className="size-4 text-red-500" />
            <span className="text-trim">Why must the computer try the instruction again?</span>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-5 px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-1">
          <h2 className="font-secondary text-lg font-medium">Rate your confidence</h2>
          <p className="text-sm leading-5 text-foreground/55">
            How well could you explain virtual memory without help right now?
          </p>
        </div>
        <div className="grid grid-cols-5 gap-1" aria-label="Confidence from 1 to 10">
          {[2, 4, 6, 8, 10].map((value) => (
            <button
              aria-label={`${value} out of 10`}
              aria-pressed={confidence === value}
              className={cn(
                "h-9 border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30",
                confidence !== value && "bg-background hover:border-foreground/40",
                confidence === value && value <= 4 && "border-red-600 bg-red-600 text-white",
                confidence === value && value > 4 && value < 8 && "border-orange-500 bg-orange-500 text-white",
                confidence === value && value >= 8 && "border-emerald-600 bg-emerald-600 text-white",
              )}
              key={value}
              onClick={() => setConfidence(value)}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 border-l-2 border-orange-500 pl-3 text-sm">
          <span className="text-foreground/55">You rated yourself</span>
          <span className="font-medium">{confidence}/10</span>
          <span className="text-foreground/55">Your answers show</span>
          <span className="font-medium text-orange-600">5/10</span>
        </div>
      </section>
    </div>
  </aside>
);

const SessionWorkspace = ({ filename, pageCount }: SessionWorkspaceProps) => {
  const [activeView, setActiveView] = useState<"explain" | "mirror">("explain");
  const [turns, setTurns] = useState(INITIAL_TURNS);
  const [response, setResponse] = useState("");
  const [hintLevel, setHintLevel] = useState(0);
  const [confidence, setConfidence] = useState(8);

  const submitResponse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = response.trim();
    if (!content) return;

    const nextId = turns.length + 1;
    setTurns((current) => [
      ...current,
      { id: nextId, speaker: "You", content },
      { ...FIXTURE_RESPONSE, id: nextId + 1 },
    ]);
    setResponse("");
    setHintLevel(0);
  };

  const requestHelp = () => {
    setHintLevel((current) => Math.min(current + 1, HINTS.length + 1));
  };

  return (
    <div className="overflow-hidden border bg-background shadow-[7px_7px_0_#d1fae5] lg:flex lg:h-[calc(100dvh-9.5rem)] lg:flex-col">
      <header className="flex flex-col border-b">
        <div className="flex min-w-0 items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <FileText aria-hidden="true" className="size-4 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{filename}</p>
              <p className="text-xs text-foreground/75">
                {pageCount} {pageCount === 1 ? "page" : "pages"} · Current concept: Virtual memory
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-xs text-foreground/75">2 of 6 understood</span>
              <div className="h-1.5 w-24 bg-muted" aria-hidden="true">
                <div className="h-full w-1/3 bg-emerald-500" />
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">End session</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-secondary text-2xl font-medium">
                    End this session?
                  </DialogTitle>
                  <DialogDescription>
                    This prototype will return you to the dashboard. Persistence will be added after the interaction design is approved.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Keep learning</Button>
                  </DialogClose>
                  <Button asChild>
                    <Link href="/dashboard">End session</Link>
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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

      <div className="min-h-0 lg:grid lg:flex-1 lg:grid-cols-[minmax(0,1.65fr)_minmax(19rem,1fr)]">
        <section
          aria-labelledby="explain-tab"
          className={cn(
            "min-h-152 flex-col lg:h-full lg:min-h-0",
            activeView === "explain" ? "flex" : "hidden lg:flex",
          )}
          id="explain-panel"
          role="tabpanel"
        >
          <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-5 py-8 sm:px-8 lg:px-10">
            {turns.map((turn) => (
              <article className="grid gap-3 sm:grid-cols-[5.5rem_1fr] sm:items-start sm:gap-5" key={turn.id}>
                <div className="flex items-start gap-2">
                  <span className={cn(
                    "text-trim text-xs font-medium uppercase tracking-[0.14em]",
                    turn.speaker === "AI" ? "mt-0.5 text-emerald-600" : "mt-1.5 text-foreground",
                  )}>
                    {turn.label ?? turn.speaker}
                  </span>
                </div>
                <p className={cn(
                  "text-trim max-w-2xl leading-7",
                  turn.speaker === "AI"
                    ? "font-secondary text-xl sm:leading-8"
                    : "text-foreground/75",
                )}>
                  {turn.content}
                </p>
              </article>
            ))}

            {hintLevel > 0 ? (
              <div className="grid gap-3 border-l-2 border-emerald-500 pl-4 sm:ml-30">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-emerald-600">
                  <Lightbulb aria-hidden="true" className="size-3.5" />
                  {hintLevel <= HINTS.length ? `Hint ${hintLevel} of ${HINTS.length}` : "Answer"}
                </p>
                <p className="max-w-2xl text-sm leading-6 text-foreground/75">
                  {hintLevel <= HINTS.length
                    ? HINTS[hintLevel - 1]
                    : "The processor notices that the page is not in RAM and pauses the program. The operating system loads the page from storage into RAM, updates the page table, and tries the instruction again. This time, the address points to data that is ready in memory."}
                </p>
              </div>
            ) : null}
          </div>

          <form className="shrink-0 border-t bg-background p-4 sm:p-6" onSubmit={submitResponse}>
            <div className="border border-foreground/25 bg-background focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
              <label className="sr-only" htmlFor="explanation-response">Explain your understanding</label>
              <textarea
                className="min-h-24 w-full resize-none bg-transparent px-4 py-3 text-[0.98rem] leading-6 outline-none placeholder:text-foreground/50"
                id="explanation-response"
                onChange={(event) => setResponse(event.target.value)}
                placeholder="Explain what happens next..."
                value={response}
              />
              <div className="flex items-center justify-between gap-3 border-t px-3 py-2">
                <Button onClick={requestHelp} size="sm" type="button" variant="ghost">
                  {hintLevel < HINTS.length ? (
                    <Lightbulb aria-hidden="true" data-icon="inline-start" />
                  ) : (
                    <BookOpen aria-hidden="true" data-icon="inline-start" />
                  )}
                  {hintLevel < HINTS.length ? "Request a hint" : "Show the answer"}
                </Button>
                <Button aria-label="Send explanation" disabled={!response.trim()} size="icon-sm" type="submit" title="Send explanation">
                  <ArrowUp aria-hidden="true" />
                </Button>
              </div>
            </div>
          </form>
        </section>

        <div
          aria-labelledby="mirror-tab"
          className={cn("min-h-0", activeView === "mirror" ? "block" : "hidden lg:block")}
          id="mirror-panel"
          role="tabpanel"
        >
          <UnderstandingMirror confidence={confidence} setConfidence={setConfidence} />
        </div>
      </div>
    </div>
  );
};

export default SessionWorkspace;