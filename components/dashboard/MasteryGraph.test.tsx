import { render, screen } from "@testing-library/react";
import { useConvexAuth, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import MasteryGraph from "@/components/dashboard/MasteryGraph";

jest.mock("convex/react", () => ({
  useConvexAuth: jest.fn(),
  useQuery: jest.fn(),
}));
jest.mock("@xyflow/react", () => ({
  Background: () => null,
  BackgroundVariant: { Dots: "dots" },
  Controls: () => null,
  ReactFlow: ({ nodes }: { nodes: Array<{ id: string; data: { label: string } }> }) => (
    <div aria-label="Flow canvas">
      {nodes.map((node) => <span key={node.id}>{node.data.label}</span>)}
    </div>
  ),
}));

type MasteryGraphData = FunctionReturnType<typeof api.mastery.getCurrentUser>;

const mockUseQuery = useQuery as jest.Mock;
const mockUseConvexAuth = useConvexAuth as jest.Mock;
const initialGraph: MasteryGraphData = {
  nodes: [{
    id: "concept-1" as MasteryGraphData["nodes"][number]["id"],
    name: "Bayes theorem",
    description: "Updates the probability of a hypothesis with new evidence.",
    confidenceScore: 74,
    masteryState: "demonstrated",
    evidenceCount: 5,
    sessionCount: 2,
    sourceCount: 2,
    lastPracticedAt: 1,
  }],
  edges: [],
};

describe("MasteryGraph", () => {
  it("uses the server graph while Convex authentication connects", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    mockUseQuery.mockReturnValue(undefined);

    render(<MasteryGraph initialGraph={initialGraph} />);

    expect(mockUseQuery).toHaveBeenCalledWith(api.mastery.getCurrentUser, "skip");
    expect(screen.getAllByText(/Bayes theorem/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/74%/).length).toBeGreaterThan(0);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Demonstrated")).toBeInTheDocument();
  });

  it("replaces stale server data with the realtime graph", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({ nodes: [], edges: [] });

    render(<MasteryGraph initialGraph={initialGraph} />);

    expect(mockUseQuery).toHaveBeenCalledWith(api.mastery.getCurrentUser, {});
    expect(screen.queryByText(/Bayes theorem/)).not.toBeInTheDocument();
    expect(screen.getByText("Your mastery map starts here")).toBeInTheDocument();
  });
});