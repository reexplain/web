"use client";

import { useMemo, useState } from "react";
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
  GraphLayoutPosition,
  MasteryGraphData,
  MasteryGraphProps,
  MasteryNode,
} from "@/types/dashboard";
import { cn } from "@/utils/ui/cn";

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
  const positions = new Map<string, GraphLayoutPosition>();
  const sortedNodes = [...nodes].sort((left, right) => left.name.localeCompare(right.name));
  const columnCount = Math.ceil(Math.sqrt(nodes.length));

  sortedNodes.forEach((node, index) => {
    positions.set(node.id, {
      x: 72 + (index % columnCount) * 240,
      y: 72 + Math.floor(index / columnCount) * 150,
      velocityX: 0,
      velocityY: 0,
    });
  });

  for (let iteration = 0; iteration < 140; iteration += 1) {
    for (let leftIndex = 0; leftIndex < sortedNodes.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < sortedNodes.length; rightIndex += 1) {
        const left = positions.get(sortedNodes[leftIndex].id)!;
        const right = positions.get(sortedNodes[rightIndex].id)!;
        const deltaX = right.x - left.x;
        const deltaY = right.y - left.y;
        const distance = Math.max(1, Math.hypot(deltaX, deltaY));
        const force = 1_800 / (distance * distance);
        const forceX = (deltaX / distance) * force;
        const forceY = (deltaY / distance) * force;

        left.velocityX -= forceX;
        left.velocityY -= forceY;
        right.velocityX += forceX;
        right.velocityY += forceY;
      }
    }

    for (const edge of edges) {
      const source = positions.get(edge.sourceConceptId);
      const target = positions.get(edge.targetConceptId);
      if (!source || !target) continue;

      const deltaX = target.x - source.x;
      const deltaY = target.y - source.y;
      const distance = Math.max(1, Math.hypot(deltaX, deltaY));
      const force = (distance - 230) * 0.018;
      const forceX = (deltaX / distance) * force;
      const forceY = (deltaY / distance) * force;

      source.velocityX += forceX;
      source.velocityY += forceY;
      target.velocityX -= forceX;
      target.velocityY -= forceY;
    }

    positions.forEach((position) => {
      position.velocityX *= 0.72;
      position.velocityY *= 0.72;
      position.x += position.velocityX;
      position.y += position.velocityY;
    });
  }

  return positions;
};

const buildFlowNodes = (
  nodes: MasteryNode[],
  edges: MasteryGraphData["edges"],
  isConnectionAligned: boolean,
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

    return {
      id: node.id,
      position: isConnectionAligned
        ? connectionAlignedPositions!.get(node.id)!
        : {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
          },
      data: { label: `${node.name} · ${node.confidenceScore}%` },
      style: {
        width: 164,
        minHeight: 58,
        padding: 10,
        border: `2px solid ${palette.border}`,
        background: palette.background,
        color: palette.color,
        borderRadius: 0,
        fontFamily: "Satoshi, sans-serif",
        fontSize: 13,
        fontWeight: 600,
        boxShadow: node.masteryState === "mastered" ? "4px 4px 0 var(--graph-mastered-shadow)" : "none",
      },
    };
  });
};

const buildFlowEdges = (edges: MasteryGraphData["edges"]): Edge[] =>
  edges.map((edge) => ({
    id: edge.id,
    source: edge.sourceConceptId,
    target: edge.targetConceptId,
    style: {
      stroke: "var(--graph-edge)",
      strokeWidth: 1 + edge.similarity * 2,
      opacity: 0.35 + edge.similarity * 0.45,
    },
  }));

const MasteryGraph = ({ graph }: MasteryGraphProps) => {
  const [isConnectionAligned, setIsConnectionAligned] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const flowNodes = useMemo(
    () => buildFlowNodes(graph.nodes, graph.edges, isConnectionAligned),
    [graph.edges, graph.nodes, isConnectionAligned],
  );
  const flowEdges = useMemo(() => buildFlowEdges(graph.edges), [graph.edges]);
  const selectedNode =
    graph.nodes.find((node) => node.id === selectedId) ?? graph.nodes[0];

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
                fitViewOptions={{ padding: 0.2 }}
                nodes={flowNodes}
                nodesConnectable={false}
                nodesDraggable={false}
                onNodeClick={(_, node) => setSelectedId(node.id)}
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
                    <h3 className="font-secondary text-xl font-medium">{selectedNode.name}</h3>
                    <p className="text-sm leading-6 text-foreground/65">{selectedNode.description}</p>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                    <div><dt className="text-foreground/50">Confidence</dt><dd className="font-medium">{selectedNode.confidenceScore}%</dd></div>
                    <div><dt className="text-foreground/50">Evidence</dt><dd className="font-medium">{selectedNode.evidenceCount}</dd></div>
                    <div><dt className="text-foreground/50">Sessions</dt><dd className="font-medium">{selectedNode.sessionCount}</dd></div>
                    <div><dt className="text-foreground/50">Sources</dt><dd className="font-medium">{selectedNode.sourceCount}</dd></div>
                  </dl>
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
