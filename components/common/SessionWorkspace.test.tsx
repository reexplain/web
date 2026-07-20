import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import SessionWorkspace from "@/components/common/SessionWorkspace";

const mockReplace = jest.fn();

jest.mock("sonner", () => ({
  toast: { error: jest.fn() },
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockToastError = toast.error as jest.Mock;

class MockMediaRecorder {
  static isTypeSupported = jest.fn(() => true);
  static latest: MockMediaRecorder | null = null;

  mimeType: string;
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;
  state: RecordingState = "inactive";

  constructor(
    readonly stream: MediaStream,
    options?: MediaRecorderOptions,
  ) {
    this.mimeType = options?.mimeType ?? "audio/webm";
    MockMediaRecorder.latest = this;
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    this.ondataavailable?.({
      data: new Blob(["recorded speech"], { type: this.mimeType }),
    } as BlobEvent);
    this.onstop?.();
  }
}

const activeWorkspace = {
  status: "active",
  startedAt: 1,
  document: { filename: "memory.pdf", pageCount: 4 },
  turns: [{ id: "turn-1", role: "assistant", interactionType: "explain", content: "Explain paging." }],
  activeConceptName: "Paging",
  understandingScore: 50,
  concepts: [{ id: "concept-1", name: "Paging", state: "demonstrated" }],
  evidence: [{
    id: "evidence-1",
    conceptName: "Paging",
    kind: "supports",
    claim: "Identified the address mapping.",
    rationale: "The explanation connected both address spaces.",
    strength: 80,
    createdAt: 1,
  }],
  openQuestions: [],
};

describe("SessionWorkspace", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
    mockReplace.mockClear();
    mockToastError.mockClear();
    MockMediaRecorder.latest = null;
    Object.defineProperty(global, "MediaRecorder", {
      configurable: true,
      value: MockMediaRecorder,
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{ stop: jest.fn() }],
        }),
      },
    });
  });

  it("hydrates the saved learning session", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => activeWorkspace,
    });

    render(<SessionWorkspace learningSessionId="session-1" />);

    await waitFor(() => expect(screen.getByText("memory.pdf")).toBeInTheDocument());
    expect(screen.getByText("Explain paging.")).toBeInTheDocument();
    expect(screen.getByText(/current concept: paging/i)).toBeInTheDocument();
    expect(screen.getByText("Identified the address mapping.")).toBeInTheDocument();
    expect(screen.getByText("1 of 1 understood")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "100% concepts understood" }))
      .toHaveStyle({ width: "100%" });
    expect(screen.getByText("LISTENING")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Teach" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Teach the next idea in your own words...")).toBeInTheDocument();
    const recordButton = screen.getByRole("button", { name: "Record" });
    const sendButton = screen.getByRole("button", { name: "Send explanation" });
    expect(recordButton).toHaveClass("bg-emerald-500");
    expect(recordButton.parentElement).toContainElement(sendButton);
    expect(screen.getByText("0:00 / 2:00")).toBeInTheDocument();
    expect(screen.queryByText("Voice response")).not.toBeInTheDocument();
    expect(screen.queryByText("Or type")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Teach the AI learner")).toHaveAttribute("maxlength", "4000");
    expect(screen.getByText("0 / 4,000")).toBeInTheDocument();

    const teachPanel = screen.getByRole("tabpanel", { name: "Teach" });
    expect(teachPanel).toHaveClass("min-h-0", "flex-1", "overflow-hidden");
    expect(teachPanel).not.toHaveClass("min-h-152");
    expect(teachPanel.parentElement).toHaveClass("flex", "min-h-0", "flex-1");
    expect(teachPanel.parentElement?.parentElement).toHaveClass(
      "flex",
      "flex-col",
      "h-[calc(100dvh-7.5rem)]",
      "sm:h-[calc(100dvh-8.5rem)]",
      "overflow-hidden",
    );

    fireEvent.click(screen.getByRole("tab", { name: "Learning mirror" }));
    const mirrorPanel = screen.getByRole("tabpanel", { name: "Learning mirror" });
    expect(mirrorPanel).toHaveClass("min-h-0", "flex-1", "overflow-hidden");
    expect(screen.getByRole("region", { name: "Learning mirror content" })).toHaveClass(
      "h-full",
      "min-h-0",
      "touch-pan-y",
      "overscroll-contain",
      "overflow-y-auto",
    );
    expect(
      screen.queryByRole("region", { name: "Learning mirror details" }),
    ).not.toBeInTheDocument();
  });

  it("opens the latest summary for a saved in-progress session", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...activeWorkspace,
        summary: "The learner connected paging to address translation.",
      }),
    });

    render(
      <SessionWorkspace
        initialView="summary"
        learningSessionId="session-1"
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Here's what your explanations revealed",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Progress saved")).toBeInTheDocument();
    expect(
      screen.getByText("The learner connected paging to address translation."),
    ).toBeInTheDocument();
  });

  it("shows the AI thinking bubble until the first session message loads", async () => {
    let resolveSession: (value: { ok: boolean; json: () => Promise<typeof activeWorkspace> }) => void;
    const pendingSession = new Promise<{ ok: boolean; json: () => Promise<typeof activeWorkspace> }>((resolve) => {
      resolveSession = resolve;
    });
    global.fetch = jest.fn().mockReturnValue(pendingSession);

    render(<SessionWorkspace learningSessionId="session-1" />);

    expect(screen.getByRole("status", { name: "AI learner is listening" })).toBeInTheDocument();

    resolveSession!({ ok: true, json: async () => activeWorkspace });

    expect(await screen.findByText("Explain paging.")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("status", { name: "AI learner is listening" })).not.toBeInTheDocument();
    });
  });

  it("records voice as the primary input and inserts the transcript for review", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => activeWorkspace })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: "Paging maps virtual to physical addresses.", truncated: false }),
      });

    render(<SessionWorkspace learningSessionId="session-1" />);
    await screen.findByText("Explain paging.");

    fireEvent.click(screen.getByRole("button", { name: "Record" }));
    expect(await screen.findByRole("button", { name: "Stop recording" })).toBeInTheDocument();
    expect(screen.getByText("0:00 / 2:00")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Stop recording" }));

    expect(
      await screen.findByDisplayValue("Paging maps virtual to physical addresses."),
    ).toBeInTheDocument();
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/learning-sessions/session-1/transcribe",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
  });

  it("hides concept progress until a response has been evaluated", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...activeWorkspace,
        understandingScore: 0,
        concepts: [{ id: "concept-1", name: "Paging", state: "unexplored" }],
        evidence: [],
      }),
    });

    render(<SessionWorkspace learningSessionId="session-1" />);

    await screen.findByText("Explain paging.");
    expect(screen.queryByText(/of 1 understood/i)).not.toBeInTheDocument();
  });

  it("submits on Enter and immediately shows the learner turn and AI typing state", async () => {
    const pendingTurn = new Promise(() => undefined);
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => activeWorkspace })
      .mockReturnValueOnce(pendingTurn);

    render(<SessionWorkspace learningSessionId="session-1" />);
    await screen.findByText("Explain paging.");

    const textarea = screen.getByLabelText("Teach the AI learner");
    fireEvent.change(textarea, { target: { value: "A page table maps virtual addresses." } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" });

    expect(screen.getByText("A page table maps virtual addresses.")).toBeInTheDocument();
    expect(screen.getByText("YOU")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "AI learner is thinking" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("The AI learner is thinking...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sending explanation" })).toBeDisabled();
  });

  it("scrolls to the latest AI turn after the response is received", async () => {
    const updatedWorkspace = {
      ...activeWorkspace,
      turns: [
        ...activeWorkspace.turns,
        {
          id: "turn-2",
          role: "learner" as const,
          content: "A page table maps virtual addresses.",
        },
        {
          id: "turn-3",
          role: "assistant" as const,
          interactionType: "probe" as const,
          content: "What does each page-table entry contain?",
        },
      ],
    };
    const scrollIntoView = Element.prototype.scrollIntoView as jest.Mock;
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => activeWorkspace })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ workspace: updatedWorkspace }) });

    render(<SessionWorkspace learningSessionId="session-1" />);
    await screen.findByText("Explain paging.");
    scrollIntoView.mockClear();

    const textarea = screen.getByLabelText("Teach the AI learner");
    fireEvent.change(textarea, { target: { value: "A page table maps virtual addresses." } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" });

    expect(await screen.findByText("What does each page-table entry contain?")).toBeInTheDocument();
    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "end" });
    });
  });

  it("shows an ending state while completion is pending", async () => {
    const pendingCompletion = new Promise(() => undefined);
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => activeWorkspace })
      .mockReturnValueOnce(pendingCompletion);

    render(<SessionWorkspace learningSessionId="session-1" />);
    await screen.findByText("Explain paging.");

    fireEvent.click(screen.getByRole("button", { name: "Complete session" }));
    const completeButtons = await screen.findAllByRole("button", { name: "Complete session" });
    fireEvent.click(completeButtons.at(-1)!);

    expect(
      screen.getByRole("button", { name: "Completing session...", hidden: true }),
    ).toBeDisabled();
  });

  it("shows a progress summary after saving an incomplete session", async () => {
    const incompleteWorkspace = {
      ...activeWorkspace,
      activeDurationMs: 120_000,
      concepts: [{ id: "concept-1", name: "Paging", state: "developing" }],
    };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => incompleteWorkspace })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "active", workspace: incompleteWorkspace }),
      });

    render(<SessionWorkspace learningSessionId="session-1" />);
    await screen.findByText("Explain paging.");

    fireEvent.click(screen.getByRole("button", { name: "Save and leave" }));
    const leaveButtons = await screen.findAllByRole("button", { name: "Save and leave" });
    fireEvent.click(leaveButtons.at(-1)!);

    expect(
      await screen.findByRole("heading", { name: "Here's what your explanations revealed" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Progress saved")).toBeInTheDocument();
    expect(screen.getByText("2 min")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to dashboard/i })).toBeInTheDocument();
  });

  it("saves before following the top-bar logo link", async () => {
    const incompleteWorkspace = {
      ...activeWorkspace,
      concepts: [{ id: "concept-1", name: "Paging", state: "developing" }],
    };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => incompleteWorkspace })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "active", workspace: incompleteWorkspace }),
      });

    render(
      <>
        <a href="/dashboard">ReExplain</a>
        <SessionWorkspace learningSessionId="session-1" />
      </>,
    );
    await screen.findByText("Explain paging.");

    fireEvent.click(screen.getByRole("link", { name: "ReExplain" }));

    expect(screen.getByRole("heading", { name: "Save before leaving?" }))
      .toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Save and leave" }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/dashboard"));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("saves before continuing browser Back navigation", async () => {
    const historyBack = jest.spyOn(window.history, "back").mockImplementation(() => undefined);
    const incompleteWorkspace = {
      ...activeWorkspace,
      concepts: [{ id: "concept-1", name: "Paging", state: "developing" }],
    };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => incompleteWorkspace })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "active", workspace: incompleteWorkspace }),
      });

    render(<SessionWorkspace learningSessionId="session-1" />);
    await screen.findByText("Explain paging.");

    fireEvent.popState(window);

    expect(screen.getByRole("heading", { name: "Save before leaving?" }))
      .toBeInTheDocument();
    expect(historyBack).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Save and leave" }));

    await waitFor(() => expect(historyBack).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledTimes(2);
    historyBack.mockRestore();
  });

  it("reports visible session time when saving progress", async () => {
    const dateNow = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const initialIncompleteWorkspace = {
      ...activeWorkspace,
      concepts: [{ id: "concept-1", name: "Paging", state: "developing" }],
    };
    const savedWorkspace = { ...initialIncompleteWorkspace, activeDurationMs: 120_000 };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => initialIncompleteWorkspace })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "active", workspace: savedWorkspace }),
      });

    render(<SessionWorkspace learningSessionId="session-1" />);
    await screen.findByText("Explain paging.");
    dateNow.mockReturnValue(121_000);

    fireEvent.click(screen.getByRole("button", { name: "Save and leave" }));
    const leaveButtons = await screen.findAllByRole("button", { name: "Save and leave" });
    fireEvent.click(leaveButtons.at(-1)!);
    await screen.findByRole("heading", { name: "Here's what your explanations revealed" });

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/learning-sessions/session-1/complete",
      expect.objectContaining({
        body: JSON.stringify({ activeDurationMs: 120_000 }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );
    dateNow.mockRestore();
  });

  it("shows the final Convex summary after ending the session", async () => {
    const completedWorkspace = {
      ...activeWorkspace,
      status: "completed",
      completedAt: 601_000,
      summary: "The learner connected paging to address translation.",
    };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => activeWorkspace })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "completed", workspace: completedWorkspace }),
      });

    render(<SessionWorkspace learningSessionId="session-1" />);
    await screen.findByText("Explain paging.");

    fireEvent.click(screen.getByRole("button", { name: "Complete session" }));
    const completeButtons = await screen.findAllByRole("button", { name: "Complete session" });
    fireEvent.click(completeButtons.at(-1)!);

    expect(
      await screen.findByRole("heading", { name: "Here's what your explanations revealed" }),
    ).toBeInTheDocument();
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/learning-sessions/session-1/complete",
      expect.objectContaining({ method: "POST" }),
    );
    expect(screen.getByText("The learner connected paging to address translation.")).toBeInTheDocument();
  });

  it("shows completion failures in a toast", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => activeWorkspace })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "The session could not be ended." }),
      });

    render(<SessionWorkspace learningSessionId="session-1" />);
    await screen.findByText("Explain paging.");

    fireEvent.click(screen.getByRole("button", { name: "Complete session" }));
    const completeButtons = await screen.findAllByRole("button", { name: "Complete session" });
    fireEvent.click(completeButtons.at(-1)!);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("The session could not be ended.");
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
