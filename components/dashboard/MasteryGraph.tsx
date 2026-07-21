"use client";

import { useMemo, useState } from "react";
import dagre from "@dagrejs/dagre";
import {
  Background,
  BackgroundVariant,
  ControlButton,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { Network, Workflow } from "lucide-react";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import type {
  MasteryGraphData,
  MasteryGraphProps,
  MasteryNode,
} from "@/types/dashboard";
import { getShortConceptLabel } from "@/utils/concepts/get-short-concept-label";
import { cn } from "@/utils/ui/cn";

const GRAPH_NODE_WIDTH = 164;
const GRAPH_NODE_MIN_HEIGHT = 58;
const GRAPH_NODE_Z_INDEX = 60;
const GRAPH_SELECTED_NODE_Z_INDEX = 70;
const GRAPH_NODE_CONTENT_WIDTH = 20;
const GRAPH_NODE_LINE_HEIGHT = 18;
const GRAPH_NODE_VERTICAL_CHROME = 24;

const getGraphNodeHeight = (node: MasteryNode) => {
  const label = `${getShortConceptLabel(node.name)} · ${node.confidenceScore}%`;
  const lineCount = Math.max(1, Math.ceil(label.length / GRAPH_NODE_CONTENT_WIDTH));
  return Math.max(
    GRAPH_NODE_MIN_HEIGHT,
    lineCount * GRAPH_NODE_LINE_HEIGHT + GRAPH_NODE_VERTICAL_CHROME,
  );
};

const stateStyles = {
  unexplored: {
    background: "var(--graph-unexplored-background)",
    border: "var(--graph-unexplored-border)",
    color: "var(--graph-unexplored-foreground)",
  },
  developing: {
    background: "var(--graph-developing-background)",
    border: "var(--graph-developing-border)",
    color: "var(--graph-developing-foreground)",
  },
  demonstrated: {
    background: "var(--graph-demonstrated-background)",
    border: "var(--graph-demonstrated-border)",
    color: "var(--graph-demonstrated-foreground)",
  },
  mastered: {
    background: "var(--graph-mastered-background)",
    border: "var(--graph-mastered-border)",
    color: "var(--graph-mastered-foreground)",
  },
} as const;

const stateLabel = {
  unexplored: "Unexplored",
  developing: "Developing",
  demonstrated: "Demonstrated",
  mastered: "Mastered",
} as const;

const buildConnectionAlignedPositions = (
  nodes: MasteryNode[],
  edges: MasteryGraphData["edges"],
) => {
  const layout = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  layout.setGraph({
    acyclicer: "greedy",
    edgesep: 20,
    marginx: 24,
    marginy: 24,
    nodesep: 36,
    rankdir: "TB",
    ranker: "network-simplex",
    ranksep: 56,
  });

  for (const node of nodes) {
    layout.setNode(node.id, {
      width: GRAPH_NODE_WIDTH,
      height: getGraphNodeHeight(node),
    });
  }
  for (const edge of edges) {
    layout.setEdge(edge.sourceConceptId, edge.targetConceptId);
  }
  dagre.layout(layout);

  return new Map(
    nodes.map((node) => {
      const position = layout.node(node.id);
      return [node.id, {
        x: position.x - GRAPH_NODE_WIDTH / 2,
        y: position.y - getGraphNodeHeight(node) / 2,
      }];
    }),
  );
};

const buildFlowNodes = (
  nodes: MasteryNode[],
  edges: MasteryGraphData["edges"],
  isConnectionAligned: boolean,
  selectedNodeId?: string,
): Node[] => {
  const centerX = 330;
  const centerY = 220;
  const connectionAlignedPositions = isConnectionAligned
    ? buildConnectionAlignedPositions(nodes, edges)
    : undefined;

  return nodes.map((node, index) => {
    const ring = Math.floor(index / 7) + 1;
    const angle = index * 2.399963;
    const radius = nodes.length === 1 ? 0 : 105 + ring * 72;
    const palette = stateStyles[node.masteryState];
    const isSelected = node.id === selectedNodeId;

    return {
      className: isSelected ? "mastery-node-selected" : undefined,
      id: node.id,
      position: isConnectionAligned
        ? connectionAlignedPositions!.get(node.id)!
        : {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
          },
      data: { label: `${getShortConceptLabel(node.name)} · ${node.confidenceScore}%` },
      style: {
        alignItems: "center",
        padding: 10,
        border: `2px solid ${palette.border}`,
        background: palette.background,
        color: palette.color,
        borderRadius: 0,
        fontFamily: "Satoshi, sans-serif",
        fontSize: 13,
        fontWeight: 600,
        height: "fit-content",
        justifyContent: "center",
        minHeight: GRAPH_NODE_MIN_HEIGHT,
        boxShadow: isSelected
          ? "0 0 0 3px #f97316, 0 0 18px 5px rgb(249 115 22 / 45%)"
          : node.masteryState === "mastered"
            ? "4px 4px 0 var(--graph-mastered-shadow)"
            : "none",
        textAlign: "center",
        width: GRAPH_NODE_WIDTH,
      },
      zIndex: isSelected ? GRAPH_SELECTED_NODE_Z_INDEX : GRAPH_NODE_Z_INDEX,
    };
  });
};

const buildFlowEdges = (
  edges: MasteryGraphData["edges"],
  hoveredNodeId?: string,
): Edge[] => edges.map((edge) => {
  const isRelatedToHoveredNode = hoveredNodeId === edge.sourceConceptId ||
    hoveredNodeId === edge.targetConceptId;

  return {
    className: isRelatedToHoveredNode ? "mastery-edge-active" : undefined,
    id: edge.id,
    source: edge.sourceConceptId,
    target: edge.targetConceptId,
    style: {
      stroke: isRelatedToHoveredNode
        ? "#10b981"
        : "var(--graph-edge)",
      strokeWidth: isRelatedToHoveredNode ? 4 : 1 + edge.similarity * 2,
      opacity: hoveredNodeId
        ? isRelatedToHoveredNode ? 1 : 0.08
        : 0.35 + edge.similarity * 0.45,
    },
    zIndex: isRelatedToHoveredNode ? 1 : 0,
  };
});

const buildFallbackEdges = (nodes: MasteryNode[]): MasteryGraphData["edges"] =>
  nodes.slice(1).map((node) => ({
    id: `fallback:${node.id}`,
    sourceConceptId: node.id,
    targetConceptId: nodes[0].id,
    relationship: "related",
    similarity: 0.6,
    strength: 60,
  }));

const MasteryGraph = ({ graph }: MasteryGraphProps) => {
  const [isConnectionAligned, setIsConnectionAligned] = useState(true);
  const [hoveredNodeId, setHoveredNodeId] = useState<string>();
  const [selectedId, setSelectedId] = useState<string>();
  const visibleEdges = useMemo(
    () => graph.edges.length > 0 ? graph.edges : buildFallbackEdges(graph.nodes),
    [graph.edges, graph.nodes],
  );
  const selectedNode =
    graph.nodes.find((node) => node.id === selectedId) ?? graph.nodes[0];
  const selectedNodeLabel = selectedNode
    ? getShortConceptLabel(selectedNode.name)
    : undefined;
  const flowNodes = useMemo(
    () => buildFlowNodes(
      graph.nodes,
      visibleEdges,
      isConnectionAligned,
      selectedNode?.id,
    ),
    [graph.nodes, isConnectionAligned, selectedNode?.id, visibleEdges],
  );
  const flowEdges = useMemo(
    () => buildFlowEdges(visibleEdges, hoveredNodeId),
    [hoveredNodeId, visibleEdges],
  );
  return (
    <section className="flex scroll-mt-40 flex-col gap-5 lg:scroll-mt-8" id="mastery-graph">
      <div className="flex flex-col items-start justify-between gap-2 border-b pb-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-500">
            Knowledge topology
          </p>
          <h2 className="font-secondary text-3xl font-medium">Mastery map</h2>
        </div>
        <p className="text-sm text-foreground/55">
          {graph.nodes.length} {graph.nodes.length === 1 ? "concept" : "concepts"} across your learning
        </p>
      </div>

      {graph.nodes.length > 0 ? (
        <>
          <div className="grid min-h-0 border bg-background lg:grid-cols-[minmax(0,1fr)_17rem]">
            <div className="h-[26rem] min-w-0 sm:h-[32rem] lg:h-136" aria-label="Interactive mastery concept graph">
              <ReactFlow
                key={isConnectionAligned ? "connection-aligned" : "radial"}
                edges={flowEdges}
                fitView
                fitViewOptions={{ maxZoom: 1.15, minZoom: 0.01, padding: 0.08 }}
                minZoom={0.01}
                nodes={flowNodes}
                nodesConnectable={false}
                nodesDraggable={false}
                onNodeClick={(_, node) => setSelectedId(node.id)}
                onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
                onNodeMouseLeave={() => setHoveredNodeId(undefined)}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="var(--graph-grid)" gap={24} size={1} variant={BackgroundVariant.Dots} />
                <Controls showInteractive={false}>
                  <ControlButton
                    aria-label="Auto-align nodes by connections"
                    onClick={() => setIsConnectionAligned(true)}
                    title="Auto-align nodes by connections"
                  >
                    <Workflow aria-hidden="true" />
                  </ControlButton>
                </Controls>
              </ReactFlow>
            </div>

            <aside className="flex flex-col gap-5 border-t bg-emerald-50/40 p-5 dark:bg-emerald-950/30 lg:border-t-0 lg:border-l">
              {selectedNode ? (
                <>
                  <div className="flex flex-col gap-2">
                    <span
                      className={cn(
                        "w-fit border px-2 py-1 text-xs font-medium",
                        selectedNode.masteryState === "developing" && "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
                        selectedNode.masteryState === "demonstrated" && "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
                        selectedNode.masteryState === "mastered" && "border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-200",
                        selectedNode.masteryState === "unexplored" && "border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
                      )}
                    >
                      {stateLabel[selectedNode.masteryState]}
                    </span>
                    <h3 className="font-secondary text-xl font-medium" title={selectedNode.name}>
                      {selectedNodeLabel}
                    </h3>
                    <p className="text-sm leading-6 text-foreground/65">{selectedNode.description}</p>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                    <div><dt className="text-foreground/50">Confidence</dt><dd className="font-medium">{selectedNode.confidenceScore}%</dd></div>
                    <div><dt className="text-foreground/50">Evidence</dt><dd className="font-medium">{selectedNode.evidenceCount}</dd></div>
                    <div><dt className="text-foreground/50">Sessions</dt><dd className="font-medium">{selectedNode.sessionCount}</dd></div>
                    <div><dt className="text-foreground/50">Sources</dt><dd className="font-medium">{selectedNode.sourceCount}</dd></div>
                  </dl>
                  <div className="flex flex-col gap-2 border-t pt-4">
                    <h4 className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/50">
                      Related sessions
                    </h4>
                    <ul className="flex flex-col gap-2">
                      {selectedNode.relatedSessions.map((session) => (
                        <li className="wrap-break-word text-sm font-medium" key={session.id}>
                          {session.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}
            </aside>
          </div>

        </>
      ) : (
        <DashboardEmptyState
          description="Complete a learning session to connect concepts and track confidence over time."
          icon={Network}
          title="Your mastery map starts here"
        />
      )}
    </section>
  );
};

export default MasteryGraph;
