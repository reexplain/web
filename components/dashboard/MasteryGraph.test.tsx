import { fireEvent, render, screen } from "@testing-library/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import MasteryGraph from "@/components/dashboard/MasteryGraph";

jest.mock("@xyflow/react", () => ({
  Background: () => null,
  BackgroundVariant: { Dots: "dots" },
  ControlButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} type="button">{children}</button>
  ),
  Controls: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ReactFlow: ({ children, nodes }: { children: React.ReactNode; nodes: Array<{ id: string; data: { label: string }; position: { x: number; y: number } }> }) => (
    <div aria-label="Flow canvas">
      {nodes.map((node) => (
        <span data-testid={`flow-node-${node.id}`} key={node.id}>
          {node.data.label} at {node.position.x},{node.position.y}
        </span>
      ))}
      {children}
    </div>
  ),
}));

type MasteryGraphData = FunctionReturnType<typeof api.mastery.getCurrentUser>;

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
  it("renders the supplied mastery graph", () => {
    render(<MasteryGraph graph={initialGraph} />);

    expect(screen.getByRole("heading", { name: "Mastery map" }).closest("section"))
      .toHaveClass("scroll-mt-40", "lg:scroll-mt-8");
    expect(screen.getAllByText(/Bayes theorem/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/74%/).length).toBeGreaterThan(0);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Demonstrated")).toBeInTheDocument();
  });

  it("keeps the graph interactive on small screens and moves its details below it", () => {
    render(<MasteryGraph graph={initialGraph} />);

    const graphCanvas = screen.getByLabelText("Interactive mastery concept graph");
    const graphLayout = graphCanvas.parentElement;
    if (!graphLayout) throw new Error("Mastery graph layout is missing.");

    expect(graphLayout).toHaveClass("grid", "lg:grid-cols-[minmax(0,1fr)_17rem]");
    expect(graphCanvas).toHaveClass("h-[26rem]", "sm:h-[32rem]", "lg:h-136");
    expect(graphLayout.querySelector("aside")).toHaveClass(
      "border-t",
      "lg:border-t-0",
      "lg:border-l",
    );
  });

  it("shows the empty state for an empty realtime graph", () => {
    render(<MasteryGraph graph={{ nodes: [], edges: [] }} />);

    expect(screen.queryByText(/Bayes theorem/)).not.toBeInTheDocument();
    expect(screen.getByText("Your mastery map starts here")).toBeInTheDocument();
  });

  it("auto-aligns nodes from the graph controls", () => {
    const graph: MasteryGraphData = {
      ...initialGraph,
      nodes: [
        ...initialGraph.nodes,
        {
          ...initialGraph.nodes[0],
          id: "concept-2" as MasteryGraphData["nodes"][number]["id"],
          name: "Conditional probability",
        },
      ],
      edges: [{
        id: "edge-1" as MasteryGraphData["edges"][number]["id"],
        sourceConceptId: initialGraph.nodes[0].id,
        targetConceptId: "concept-2" as MasteryGraphData["nodes"][number]["id"],
        relationship: "related",
        similarity: 0.9,
        strength: 90,
      }],
    };
    render(<MasteryGraph graph={graph} />);

    const readPosition = (id: string) => {
      const position = screen.getByTestId(id).textContent?.match(/at ([\d.]+),([\d.]+)/);
      return { x: Number(position?.[1]), y: Number(position?.[2]) };
    };
    const distanceBetweenLinkedNodes = () => {
      const source = readPosition("flow-node-concept-1");
      const target = readPosition("flow-node-concept-2");
      return Math.hypot(source.x - target.x, source.y - target.y);
    };
    const distanceBeforeAlignment = distanceBetweenLinkedNodes();

    fireEvent.click(screen.getByRole("button", { name: "Auto-align nodes by connections" }));

    expect(distanceBetweenLinkedNodes()).toBeLessThan(distanceBeforeAlignment);
  });
});
