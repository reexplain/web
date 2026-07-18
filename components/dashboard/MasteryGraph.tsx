"use client";

import { useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { useConvexAuth, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Network } from "lucide-react";
import { api } from "@/convex/_generated/api";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import { cn } from "@/utils/ui/cn";

type MasteryGraphData = FunctionReturnType<typeof api.mastery.getCurrentUser>;
type MasteryNode = MasteryGraphData["nodes"][number];

const stateStyles = {
  unexplored: {
    background: "#f4f4f5",
    border: "#a1a1aa",
    color: "#3f3f46",
  },
  developing: {
    background: "#fffbeb",
    border: "#f59e0b",
    color: "#78350f",
  },
  demonstrated: {
    background: "#ecfdf5",
    border: "#10b981",
    color: "#064e3b",
  },
  mastered: {
    background: "#ecfeff",
    border: "#0891b2",
    color: "#164e63",
  },
} as const;

const stateLabel = {
  unexplored: "Unexplored",
  developing: "Developing",
  demonstrated: "Demonstrated",
  mastered: "Mastered",
} as const;

const buildFlowNodes = (nodes: MasteryNode[]): Node[] => {
  const centerX = 330;
  const centerY = 220;

  return nodes.map((node, index) => {
    const ring = Math.floor(index / 7) + 1;
    const angle = index * 2.399963;
    const radius = nodes.length === 1 ? 0 : 105 + ring * 72;
    const palette = stateStyles[node.masteryState];

    return {
      id: node.id,
      position: {
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
        boxShadow: node.masteryState === "mastered" ? "4px 4px 0 #a5f3fc" : "none",
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
      stroke: "#94a3b8",
      strokeWidth: 1 + edge.similarity * 2,
      opacity: 0.35 + edge.similarity * 0.45,
    },
  }));

const MasteryGraph = ({ initialGraph }: { initialGraph: MasteryGraphData }) => {
  const { isAuthenticated } = useConvexAuth();
  const liveGraph = useQuery(
    api.mastery.getCurrentUser,
    isAuthenticated ? {} : "skip",
  );
  const graph = liveGraph ?? initialGraph;
  const [selectedId, setSelectedId] = useState<string>();
  const selectedNode =
    graph.nodes.find((node) => node.id === selectedId) ?? graph.nodes[0];

  return (
    <section className="flex scroll-mt-8 flex-col gap-5" id="mastery-graph">
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
          <div className="hidden min-h-0 border bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_17rem]">
            <div className="h-136 min-w-0" aria-label="Interactive mastery concept graph">
              <ReactFlow
                edges={buildFlowEdges(graph.edges)}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                nodes={buildFlowNodes(graph.nodes)}
                nodesConnectable={false}
                nodesDraggable={false}
                onNodeClick={(_, node) => setSelectedId(node.id)}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#d4d4d8" gap={24} size={1} variant={BackgroundVariant.Dots} />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>

            <aside className="flex flex-col gap-5 border-l bg-emerald-50/40 p-5">
              {selectedNode ? (
                <>
                  <div className="flex flex-col gap-2">
                    <span
                      className={cn(
                        "w-fit border px-2 py-1 text-xs font-medium",
                        selectedNode.masteryState === "developing" && "border-amber-300 bg-amber-50 text-amber-800",
                        selectedNode.masteryState === "demonstrated" && "border-emerald-300 bg-emerald-50 text-emerald-800",
                        selectedNode.masteryState === "mastered" && "border-cyan-300 bg-cyan-50 text-cyan-800",
                        selectedNode.masteryState === "unexplored" && "border-zinc-300 bg-zinc-50 text-zinc-700",
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

          <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {graph.nodes.map((node) => (
              <li className="flex flex-col gap-3 border bg-background p-4" key={node.id}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-secondary text-lg font-medium">{node.name}</h3>
                  <span className="shrink-0 font-medium text-emerald-700">{node.confidenceScore}%</span>
                </div>
                <p className="line-clamp-3 text-sm leading-5 text-foreground/60">{node.description}</p>
                <p className="text-xs text-foreground/50">
                  {node.evidenceCount} evidence · {node.sessionCount} sessions · {node.sourceCount} sources
                </p>
              </li>
            ))}
          </ul>
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