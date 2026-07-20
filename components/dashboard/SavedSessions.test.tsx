import { fireEvent, render, screen } from "@testing-library/react";
import type { Id } from "@/convex/_generated/dataModel";
import SavedSessions from "@/components/dashboard/SavedSessions";
import type {
  DashboardSnapshot,
  DeleteSessionButtonProps,
  SavedSession,
} from "@/types/dashboard";

const emptyDashboardSnapshot = {
  sessions: [],
  practiceExcerpts: [],
  masteryGraph: { nodes: [], edges: [] },
} as DashboardSnapshot;

jest.mock("@/components/dashboard/DeleteSessionButton", () =>
  function DeleteSessionButtonMock({ className, filename, onDeleted }: DeleteSessionButtonProps) {
    return (
      <button
        className={className}
        onClick={() => onDeleted(emptyDashboardSnapshot)}
      >
        Delete {filename}
      </button>
    );
  },
);

const initialSessions = [{
  id: "session-1" as Id<"learningSessions">,
  documentId: "document-1" as Id<"documents">,
  filename: "initial.pdf",
  pageCount: 4,
  status: "active" as const,
  documentStatus: "ready" as const,
  understandingScore: 72,
  conceptCount: 2,
  summary: "The learner connected virtual memory to address translation.",
  concepts: [
    { name: "Virtual memory", state: "demonstrated" as const, score: 88 },
    { name: "Address translation", state: "developing" as const, score: 55 },
  ],
  updatedAt: 1,
}];

describe("SavedSessions", () => {
  it("renders supplied sessions", () => {
    render(<SavedSessions onSnapshotChange={jest.fn()} sessions={initialSessions} />);

    expect(
      screen.getByRole("heading", { name: "Saved learning sessions" }).closest("section"),
    ).toHaveClass("scroll-mt-40", "lg:scroll-mt-8");
    expect(screen.getByText("initial.pdf")).toBeInTheDocument();
    expect(screen.getByText("1 session")).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "View concepts for initial.pdf" }),
    );
    expect(screen.getByText("Session concepts")).toBeInTheDocument();
    expect(screen.getByText("Virtual memory")).toBeInTheDocument();
    expect(screen.getByText("Demonstrated")).toBeInTheDocument();
    expect(screen.getByText("88%")).toBeInTheDocument();
    expect(screen.getByText("Address translation")).toBeInTheDocument();
    expect(screen.getByText("Developing")).toBeInTheDocument();
    expect(screen.getByText("55%")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue session" })).toHaveAttribute(
      "href",
      "/session?id=session-1",
    );
    expect(screen.getByRole("link", { name: "Continue session" })).toHaveClass(
      "w-full",
      "md:w-auto",
    );
    expect(screen.getByRole("link", { name: "View session summary" })).toHaveAttribute(
      "href",
      "/session?id=session-1&view=summary",
    );
    expect(screen.getByRole("link", { name: "View session summary" })).toHaveClass(
      "w-full",
      "md:w-auto",
    );
    expect(screen.getByRole("button", { name: "Delete initial.pdf" })).toHaveClass(
      "w-full",
      "md:w-auto",
    );
  });

  it("shows the empty state for an empty realtime snapshot", () => {
    render(<SavedSessions onSnapshotChange={jest.fn()} sessions={[]} />);

    expect(screen.queryByText("initial.pdf")).not.toBeInTheDocument();
    expect(screen.getByText("No saved sessions yet")).toBeInTheDocument();
    expect(screen.getByText("0 sessions")).toBeInTheDocument();
  });

  it("handles legacy session snapshots without concepts", () => {
    const legacySession = {
      ...initialSessions[0],
      conceptCount: undefined,
      concepts: undefined,
    } as unknown as SavedSession;

    render(
      <SavedSessions
        onSnapshotChange={jest.fn()}
        sessions={[legacySession]}
      />,
    );

    expect(screen.getByText("Concepts").nextElementSibling).toHaveTextContent("0");
    expect(screen.getByRole("button", { name: "View concepts for initial.pdf" }))
      .toBeDisabled();
  });

  it("forwards the authoritative snapshot after deletion", () => {
    const onSnapshotChange = jest.fn();
    render(
      <SavedSessions
        onSnapshotChange={onSnapshotChange}
        sessions={initialSessions}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete initial.pdf" }));

    expect(onSnapshotChange).toHaveBeenCalledWith(emptyDashboardSnapshot);
  });

  it("keeps legacy unfinished sessions labeled as in progress", () => {
    const legacySession = {
      ...initialSessions[0],
      status: "abandoned",
    } as unknown as SavedSession;

    render(
      <SavedSessions
        onSnapshotChange={jest.fn()}
        sessions={[legacySession]}
      />,
    );

    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.queryByText("Ended")).not.toBeInTheDocument();
  });
});
