import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import SessionWorkspace from "@/components/common/SessionWorkspace";

jest.mock("sonner", () => ({
  toast: { error: jest.fn() },
}));

const mockToastError = toast.error as jest.Mock;

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
    mockToastError.mockClear();
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

    const textarea = screen.getByLabelText("Explain your understanding");
    fireEvent.change(textarea, { target: { value: "A page table maps virtual addresses." } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" });

    expect(screen.getByText("A page table maps virtual addresses.")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "AI is thinking" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sending explanation" })).toBeDisabled();
  });

  it("shows an ending state while completion is pending", async () => {
    const pendingCompletion = new Promise(() => undefined);
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => activeWorkspace })
      .mockReturnValueOnce(pendingCompletion);

    render(<SessionWorkspace learningSessionId="session-1" />);
    await screen.findByText("Explain paging.");

    fireEvent.click(screen.getByRole("button", { name: "End session" }));
    const endButtons = await screen.findAllByRole("button", { name: "End session" });
    fireEvent.click(endButtons.at(-1)!);

    expect(await screen.findByRole("button", { name: "Ending session..." })).toBeDisabled();
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

    fireEvent.click(screen.getByRole("button", { name: "End session" }));
    const endButtons = await screen.findAllByRole("button", { name: "End session" });
    fireEvent.click(endButtons.at(-1)!);

    expect(
      await screen.findByRole("heading", { name: "Here's what your explanations revealed" }),
    ).toBeInTheDocument();
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/learning-sessions/session-1/complete",
      { method: "POST" },
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

    fireEvent.click(screen.getByRole("button", { name: "End session" }));
    const endButtons = await screen.findAllByRole("button", { name: "End session" });
    fireEvent.click(endButtons.at(-1)!);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("The session could not be ended.");
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
