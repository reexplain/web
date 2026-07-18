import { fireEvent, render, screen } from "@testing-library/react";
import SessionCompletionSummary from "@/components/common/SessionCompletionSummary";
import type { WorkspaceResponse } from "@/types/session";

const workspace: WorkspaceResponse = {
  status: "completed",
  startedAt: 1_000,
  completedAt: 601_000,
  document: { filename: "algorithms.pdf", pageCount: 25 },
  turns: [
    { id: "turn-1", role: "assistant", content: "What is an instance?" },
    { id: "turn-2", role: "learner", content: "A concrete input." },
  ],
  understandingScore: 72,
  concepts: [
    {
      id: "concept-1",
      name: "Problem instances",
      description: "Distinguishes a problem from a concrete input.",
      state: "demonstrated",
      score: 84,
    },
    {
      id: "concept-2",
      name: "Correctness",
      state: "developing",
      score: 55,
    },
  ],
  evidence: [
    {
      id: "evidence-1",
      conceptName: "Problem instances",
      kind: "supports",
      claim: "Used a concrete sorting input.",
      rationale: "The example correctly separated the general problem from an instance.",
      strength: 88,
      createdAt: 2_000,
    },
  ],
  openQuestions: [
    { id: "question-1", text: "Why does correctness require termination?", priority: 80 },
  ],
  summary: "The learner can distinguish algorithmic problems from concrete instances.",
};

describe("SessionCompletionSummary", () => {
  it("shows persisted session insights and supports conversation review", () => {
    const onReview = jest.fn();

    render(<SessionCompletionSummary onReview={onReview} workspace={workspace} />);

    expect(screen.getByRole("heading", { name: "Here's what your explanations revealed" })).toBeInTheDocument();
    expect(screen.getByText("The learner can distinguish algorithmic problems from concrete instances.")).toBeInTheDocument();
    expect(screen.getByText("10 min")).toBeInTheDocument();
    expect(screen.getAllByText("Problem instances")).toHaveLength(2);
    expect(screen.getByText("Used a concrete sorting input.")).toBeInTheDocument();
    expect(screen.getByText("Why does correctness require termination?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );

    fireEvent.click(screen.getByRole("button", { name: "Review conversation" }));
    expect(onReview).toHaveBeenCalledTimes(1);
  });
});
