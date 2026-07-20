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
  ReactFlow: ({ children, edges, nodes, onNodeClick, onNodeMouseEnter, onNodeMouseLeave }: {
    children: React.ReactNode;
    edges: Array<{
      className?: string;
      id: string;
      source: string;
      target: string;
      style?: React.CSSProperties;
    }>;
    nodes: Array<{
      className?: string;
      id: string;
      data: { label: string };
      position: { x: number; y: number };
      style?: React.CSSProperties;
      zIndex?: number;
    }>;
    onNodeClick: (event: React.MouseEvent<HTMLButtonElement>, node: { id: string }) => void;
    onNodeMouseEnter: (event: React.MouseEvent<HTMLButtonElement>, node: { id: string }) => void;
    onNodeMouseLeave: () => void;
  }) => (
    <div aria-label="Flow canvas">
      {nodes.map((node) => (
        <button
          data-class={node.className}
          data-testid={`flow-node-${node.id}`}
          data-z-index={node.zIndex}
          key={node.id}
          onClick={(event) => onNodeClick(event, node)}
          onMouseEnter={(event) => onNodeMouseEnter(event, node)}
          onMouseLeave={onNodeMouseLeave}
          style={node.style}
          type="button"
        >
          {node.data.label} at {node.position.x},{node.position.y}
        </button>
      ))}
      {edges.map((edge) => (
        <span
          data-class={edge.className}
          data-opacity={edge.style?.opacity}
          data-stroke={edge.style?.stroke}
          data-stroke-width={edge.style?.strokeWidth}
          data-testid={`flow-edge-${edge.id}`}
          key={edge.id}
        >
          {edge.source} connects to {edge.target}
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
    relatedSessions: [
      {
        id: "session-1" as MasteryGraphData["nodes"][number]["relatedSessions"][number]["id"],
        name: "bayesian-inference.pdf",
      },
      {
        id: "session-2" as MasteryGraphData["nodes"][number]["relatedSessions"][number]["id"],
        name: "probability-notes.pdf",
      },
    ],
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
    expect(screen.getByTestId("flow-node-concept-1")).toHaveStyle({
      height: "fit-content",
    });
    expect(Number(screen.getByTestId("flow-node-concept-1").dataset.zIndex))
      .toBeGreaterThan(50);
    expect(screen.getByTestId("flow-node-concept-1")).toHaveAttribute(
      "data-class",
      "mastery-node-selected",
    );
    expect(screen.getByTestId("flow-node-concept-1")).toHaveStyle({
      boxShadow: "0 0 0 3px #f97316, 0 0 18px 5px rgb(249 115 22 / 45%)",
    });
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

  it("shows the sessions related to the selected node", () => {
    const graph: MasteryGraphData = {
      ...initialGraph,
      nodes: [
        ...initialGraph.nodes,
        {
          ...initialGraph.nodes[0],
          id: "concept-2" as MasteryGraphData["nodes"][number]["id"],
          name: "Conditional probability",
          relatedSessions: [{
            id: "session-3" as MasteryGraphData["nodes"][number]["relatedSessions"][number]["id"],
            name: "conditional-probability.pdf",
          }],
        },
      ],
    };
    render(<MasteryGraph graph={graph} />);

    expect(screen.getByText("bayesian-inference.pdf")).toBeInTheDocument();
    expect(screen.getByText("probability-notes.pdf")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Conditional probability/ }));

    expect(screen.getByText("conditional-probability.pdf")).toBeInTheDocument();
    expect(screen.queryByText("bayesian-inference.pdf")).not.toBeInTheDocument();
    expect(screen.getByTestId("flow-node-concept-2")).toHaveAttribute(
      "data-class",
      "mastery-node-selected",
    );
    expect(screen.getByTestId("flow-node-concept-1")).not.toHaveAttribute(
      "data-class",
      "mastery-node-selected",
    );
  });

  it("shows the empty state for an empty realtime graph", () => {
    render(<MasteryGraph graph={{ nodes: [], edges: [] }} />);

    expect(screen.queryByText(/Bayes theorem/)).not.toBeInTheDocument();
    expect(screen.getByText("Your mastery map starts here")).toBeInTheDocument();
  });

  it("visually connects concepts when a saved graph has no returned edges", () => {
    render(<MasteryGraph graph={{
      ...initialGraph,
      nodes: [
        ...initialGraph.nodes,
        {
          ...initialGraph.nodes[0],
          id: "concept-2" as MasteryGraphData["nodes"][number]["id"],
          name: "Conditional probability",
        },
      ],
    }} />);

    expect(screen.getByTestId("flow-edge-fallback:concept-2"))
      .toHaveTextContent("concept-2 connects to concept-1");
  });

  it("highlights only edges related to the hovered node", () => {
    const nodes: MasteryGraphData["nodes"] = [
      initialGraph.nodes[0],
      {
        ...initialGraph.nodes[0],
        id: "concept-2" as MasteryGraphData["nodes"][number]["id"],
        name: "Conditional probability",
      },
      {
        ...initialGraph.nodes[0],
        id: "concept-3" as MasteryGraphData["nodes"][number]["id"],
        name: "Prior probability",
      },
    ];
    const edges: MasteryGraphData["edges"] = [
      {
        id: "edge-related",
        sourceConceptId: nodes[0].id,
        targetConceptId: nodes[1].id,
        relationship: "related",
        similarity: 0.9,
        strength: 90,
      },
      {
        id: "edge-unrelated",
        sourceConceptId: nodes[1].id,
        targetConceptId: nodes[2].id,
        relationship: "related",
        similarity: 0.8,
        strength: 80,
      },
    ];
    render(<MasteryGraph graph={{ nodes, edges }} />);

    fireEvent.mouseEnter(screen.getByTestId("flow-node-concept-1"));

    expect(screen.getByTestId("flow-edge-edge-related")).toHaveAttribute(
      "data-stroke",
      "#10b981",
    );
    expect(screen.getByTestId("flow-edge-edge-related")).toHaveAttribute(
      "data-class",
      "mastery-edge-active",
    );
    expect(screen.getByTestId("flow-edge-edge-related")).toHaveAttribute(
      "data-stroke-width",
      "4",
    );
    expect(screen.getByTestId("flow-edge-edge-related")).toHaveAttribute(
      "data-opacity",
      "1",
    );
    expect(screen.getByTestId("flow-edge-edge-unrelated")).toHaveAttribute(
      "data-opacity",
      "0.08",
    );

    fireEvent.mouseLeave(screen.getByTestId("flow-node-concept-1"));

    expect(screen.getByTestId("flow-edge-edge-unrelated")).not.toHaveAttribute(
      "data-opacity",
      "0.08",
    );
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

  it("keeps every node separated after auto-aligning a dense graph", () => {
    const nodes: MasteryGraphData["nodes"] = Array.from({ length: 9 }, (_, index) => ({
      ...initialGraph.nodes[0],
      id: `concept-${index + 1}` as MasteryGraphData["nodes"][number]["id"],
      name: `Concept ${index + 1}`,
    }));
    const edges: MasteryGraphData["edges"] = nodes.flatMap((source, sourceIndex) =>
      nodes.slice(sourceIndex + 1).map((target) => ({
        id: `edge-${source.id}-${target.id}`,
        sourceConceptId: source.id,
        targetConceptId: target.id,
        relationship: "related" as const,
        similarity: 0.8,
        strength: 80,
      })),
    );
    render(<MasteryGraph graph={{ nodes, edges }} />);

    fireEvent.click(screen.getByRole("button", { name: "Auto-align nodes by connections" }));

    const positions = nodes.map((node) => {
      const match = screen.getByTestId(`flow-node-${node.id}`).textContent
        ?.match(/at (-?[\d.]+),(-?[\d.]+)/);
      return { x: Number(match?.[1]), y: Number(match?.[2]) };
    });
    for (let leftIndex = 0; leftIndex < positions.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < positions.length; rightIndex += 1) {
        const left = positions[leftIndex];
        const right = positions[rightIndex];
        const overlaps =
          Math.abs(left.x - right.x) < 164 && Math.abs(left.y - right.y) < 96;
        expect(overlaps).toBe(false);
      }
    }
  });
});
