import { fireEvent, render, screen } from "@testing-library/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardRealtime from "@/components/dashboard/DashboardRealtime";
import type { DashboardSnapshot } from "@/types/dashboard";

jest.mock("convex/react", () => ({
  useConvexAuth: jest.fn(),
  useQuery: jest.fn(),
}));
jest.mock("@/components/dashboard/MasteryGraph", () =>
  function MasteryGraphMock({ graph }: { graph: { nodes: unknown[] } }) {
    return <div>Mastery nodes: {graph.nodes.length}</div>;
  },
);
jest.mock("@/components/dashboard/PracticeConcepts", () =>
  function PracticeConceptsMock({ excerpts }: { excerpts: unknown[] }) {
    return <div>Practice items: {excerpts.length}</div>;
  },
);
jest.mock("@/components/dashboard/SavedSessions", () =>
  function SavedSessionsMock({
    onSnapshotChange,
    sessions,
  }: {
    onSnapshotChange: (snapshot: DashboardSnapshot) => void;
    sessions: unknown[];
  }) {
    return (
      <div>
        Saved sessions: {sessions.length}
        <button
          onClick={() => onSnapshotChange({
            sessions: [],
            practiceExcerpts: [],
            masteryGraph: { nodes: [], edges: [] },
          } as DashboardSnapshot)}
        >
          Apply deletion
        </button>
      </div>
    );
  },
);

const mockUseQuery = useQuery as jest.Mock;
const mockUseConvexAuth = useConvexAuth as jest.Mock;
const initialSnapshot = {
  sessions: [{ id: "session-1" }],
  practiceExcerpts: [{ id: "chunk-1:0" }],
  masteryGraph: { nodes: [{ id: "mastery-1" }], edges: [] },
} as unknown as DashboardSnapshot;

describe("DashboardRealtime", () => {
  it("uses the server snapshot until Convex authentication connects", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    mockUseQuery.mockReturnValue(undefined);

    render(<DashboardRealtime initialSnapshot={initialSnapshot} />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      api.sessions.getDashboardCurrentUser,
      "skip",
    );
    expect(screen.getByText("Saved sessions: 1")).toBeInTheDocument();
    expect(screen.getByText("Practice items: 1")).toBeInTheDocument();
    expect(screen.getByText("Mastery nodes: 1")).toBeInTheDocument();
  });

  it("replaces every dashboard section from one realtime snapshot", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({
      sessions: [],
      practiceExcerpts: [],
      masteryGraph: { nodes: [], edges: [] },
    });

    render(<DashboardRealtime initialSnapshot={initialSnapshot} />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      api.sessions.getDashboardCurrentUser,
      {},
    );
    expect(screen.getByText("Saved sessions: 0")).toBeInTheDocument();
    expect(screen.getByText("Practice items: 0")).toBeInTheDocument();
    expect(screen.getByText("Mastery nodes: 0")).toBeInTheDocument();
  });

  it("replaces every dashboard section from the deletion response", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    mockUseQuery.mockReturnValue(undefined);

    render(<DashboardRealtime initialSnapshot={initialSnapshot} />);
    fireEvent.click(screen.getByRole("button", { name: "Apply deletion" }));

    expect(screen.getByText(/Saved sessions: 0/)).toBeInTheDocument();
    expect(screen.getByText("Practice items: 0")).toBeInTheDocument();
    expect(screen.getByText("Mastery nodes: 0")).toBeInTheDocument();
  });

  it("keeps the deletion response ahead of a stale realtime snapshot", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue(initialSnapshot);

    render(<DashboardRealtime initialSnapshot={initialSnapshot} />);
    fireEvent.click(screen.getByRole("button", { name: "Apply deletion" }));

    expect(screen.getByText(/Saved sessions: 0/)).toBeInTheDocument();
    expect(screen.getByText("Practice items: 0")).toBeInTheDocument();
    expect(screen.getByText("Mastery nodes: 0")).toBeInTheDocument();
  });
});
