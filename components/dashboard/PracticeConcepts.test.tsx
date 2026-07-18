import { render, screen } from "@testing-library/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import PracticeConcepts from "@/components/dashboard/PracticeConcepts";

jest.mock("convex/react", () => ({
  useConvexAuth: jest.fn(),
  useQuery: jest.fn(),
}));
jest.mock("@/components/dashboard/Flashcard", () =>
  function FlashcardMock({ item }: { item: { excerpt: string } }) {
    return <div>Flashcard: {item.excerpt}</div>;
  },
);
jest.mock("@/components/dashboard/Quiz", () =>
  function QuizMock() {
    return <div>Quiz</div>;
  },
);
jest.mock("@/components/dashboard/Reorder", () =>
  function ReorderMock() {
    return <div>Reorder</div>;
  },
);

const mockUseQuery = useQuery as jest.Mock;
const mockUseConvexAuth = useConvexAuth as jest.Mock;
const initialExcerpts = [
  { id: "chunk-1" as Id<"documentChunks">, excerpt: "Initial concept", sequence: 0 },
  { id: "chunk-2" as Id<"documentChunks">, excerpt: "Second concept", sequence: 1 },
  { id: "chunk-3" as Id<"documentChunks">, excerpt: "Third concept", sequence: 2 },
];

describe("PracticeConcepts", () => {
  it("uses server practice while Convex authentication connects", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    mockUseQuery.mockReturnValue(undefined);

    render(<PracticeConcepts initialExcerpts={initialExcerpts} />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      api.sessions.getPracticeCurrentUser,
      "skip",
    );
    expect(screen.getByText("Flashcard: Initial concept")).toBeInTheDocument();
  });

  it("removes deleted-session practice when the realtime query becomes empty", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue([]);

    render(<PracticeConcepts initialExcerpts={initialExcerpts} />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      api.sessions.getPracticeCurrentUser,
      {},
    );
    expect(screen.queryByText("Flashcard: Initial concept")).not.toBeInTheDocument();
    expect(screen.getByText("Complete a session to unlock practice")).toBeInTheDocument();
  });

  it("switches to practice from the next completed session after deletion", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue([
      { id: "chunk-4", excerpt: "Replacement concept", sequence: 0 },
    ]);

    render(<PracticeConcepts initialExcerpts={initialExcerpts} />);

    expect(screen.getByText("Flashcard: Replacement concept")).toBeInTheDocument();
    expect(screen.queryByText("Flashcard: Initial concept")).not.toBeInTheDocument();
  });
});