import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { internal } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { auth } from "@/lib/auth";
import { mutateConvexInternal, queryConvexInternal } from "@/lib/convex-server";
import { MAX_MASTERY_CONCEPTS } from "@/constants/mastery";
import { MAX_SESSION_ACTIVE_DURATION_MS } from "@/constants/session-input";
import {
  callReExplainApi,
  isEmbeddingResult,
  ReExplainApiError,
} from "@/lib/reexplain-api";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { sessionId } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const activeDurationMs =
    body &&
    typeof body === "object" &&
    "activeDurationMs" in body &&
    typeof body.activeDurationMs === "number"
      ? body.activeDurationMs
      : undefined;
  if (
    activeDurationMs !== undefined &&
    (!Number.isSafeInteger(activeDurationMs) || activeDurationMs < 0 || activeDurationMs > MAX_SESSION_ACTIVE_DURATION_MS)
  ) {
    return NextResponse.json({ error: "The session duration is invalid." }, { status: 400 });
  }

  try {
    const workspace = await queryConvexInternal(internal.sessions.getWorkspace, {
      ownerId: session.user.id,
      sessionId: sessionId as Id<"learningSessions">,
    });
    if (!workspace) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const hasFullCoverage =
      workspace.concepts.length > 0 &&
      workspace.concepts.every((concept) => concept.state === "demonstrated");
    const evidenceCounts = new Map<string, number>();
    for (const item of workspace.evidence) {
      const key = item.conceptName.trim().toLocaleLowerCase();
      evidenceCounts.set(key, (evidenceCounts.get(key) ?? 0) + 1);
    }
    const mainConcepts = workspace.concepts.slice(0, MAX_MASTERY_CONCEPTS);
    const embeddingResult = mainConcepts.length > 0
      ? await callReExplainApi(
          "/api/v1/learning/embeddings",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inputs: mainConcepts.map(
                (concept) => `${concept.name}\n${concept.description ?? ""}`.trim(),
              ),
            }),
          },
          isEmbeddingResult,
        )
      : { embeddings: [] as number[][] };

    await mutateConvexInternal(internal.mastery.applyCompletedSession, {
      ownerId: session.user.id,
      sessionId: sessionId as Id<"learningSessions">,
      documentId: workspace.document.id,
      markCompleted: hasFullCoverage,
      ...(activeDurationMs === undefined ? {} : { activeDurationMs }),
      concepts: mainConcepts.map((concept, index) => ({
        name: concept.name,
        description: concept.description ?? "",
        score: concept.score,
        evidenceCount:
          evidenceCounts.get(concept.name.trim().toLocaleLowerCase()) ?? 0,
        embedding: embeddingResult.embeddings[index],
      })),
    });

    try {
      revalidatePath("/dashboard");
    } catch {
      // Completion is authoritative even if cache invalidation is unavailable.
    }
    return NextResponse.json({
      status: hasFullCoverage ? "completed" : "active",
      workspace: {
        ...workspace,
        activeDurationMs: Math.max(workspace.activeDurationMs ?? 0, activeDurationMs ?? 0),
        status: hasFullCoverage ? "completed" : "active",
        completedAt: hasFullCoverage ? workspace.completedAt ?? Date.now() : undefined,
      },
    });
  } catch (error) {
    if (error instanceof ReExplainApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "The session could not be ended." }, { status: 503 });
  }
}
