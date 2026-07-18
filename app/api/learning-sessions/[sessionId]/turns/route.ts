import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { internal } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { auth } from "@/lib/auth";
import { mutateConvexInternal, queryConvexInternal } from "@/lib/convex-server";
import {
  callReExplainApi,
  isLearningTurnResult,
  ReExplainApiError,
} from "@/lib/reexplain-api";

export const runtime = "nodejs";

const MAX_TURN_LENGTH = 10_000;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A JSON request body is required." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "A response is required." }, { status: 400 });
  }

  const candidate = body as { content?: unknown; requestId?: unknown };
  const content = typeof candidate.content === "string" ? candidate.content.trim() : "";
  const requestId =
    typeof candidate.requestId === "string" ? candidate.requestId.trim() : "";

  if (!content || content.length > MAX_TURN_LENGTH) {
    return NextResponse.json(
      { error: `Responses must contain between 1 and ${MAX_TURN_LENGTH} characters.` },
      { status: 400 },
    );
  }

  if (!requestId || requestId.length > 100) {
    return NextResponse.json({ error: "A valid request ID is required." }, { status: 400 });
  }

  const { sessionId } = await context.params;

  try {
    const turn = await mutateConvexInternal(internal.sessions.appendLearnerTurn, {
      ownerId: session.user.id,
      sessionId: sessionId as Id<"learningSessions">,
      content,
      requestId,
    });
    const existingAssistantTurn = await queryConvexInternal(
      internal.sessions.getAssistantForRequest,
      {
        ownerId: session.user.id,
        sessionId: sessionId as Id<"learningSessions">,
        requestId,
      },
    );
    if (existingAssistantTurn) {
      const workspace = await queryConvexInternal(internal.sessions.getWorkspace, {
        ownerId: session.user.id,
        sessionId: sessionId as Id<"learningSessions">,
      });
      return NextResponse.json({ turn, assistantTurn: existingAssistantTurn, workspace });
    }

    const generationContext = await queryConvexInternal(
      internal.sessions.getGenerationContext,
      {
        ownerId: session.user.id,
        sessionId: sessionId as Id<"learningSessions">,
      },
    );
    if (!generationContext || generationContext.documentChunks.length === 0) {
      return NextResponse.json({ error: "The learning session was not found." }, { status: 404 });
    }

    const latestHistoryTurn = generationContext.history.at(-1);
    const history =
      latestHistoryTurn?.role === "learner" && latestHistoryTurn.content === content
        ? generationContext.history.slice(0, -1)
        : generationContext.history;
    const modelResult = await callReExplainApi(
      "/api/v1/learning/turn",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_chunks: generationContext.documentChunks,
          history,
          learner_response: content,
          safety_identifier: sha256(`reexplain:${session.user.id}`),
        }),
      },
      isLearningTurnResult,
    );
    const assistantTurn = await mutateConvexInternal(
      internal.sessions.applyModelResult,
      {
        ownerId: session.user.id,
        sessionId: sessionId as Id<"learningSessions">,
        requestId,
        content: modelResult.content,
        interactionType: modelResult.interaction_type,
        activeConcept: modelResult.active_concept,
        concepts: modelResult.concepts,
        evidence: modelResult.evidence.map((item) => ({
          conceptName: item.concept_name,
          kind: item.kind,
          claim: item.claim,
          rationale: item.rationale,
          strength: item.strength,
        })),
        openQuestions: modelResult.open_questions.map((item) => ({
          conceptName: item.concept_name ?? undefined,
          text: item.text,
          priority: item.priority,
        })),
        understandingScore: modelResult.understanding_score,
        summary: modelResult.summary,
      },
    );
    const workspace = await queryConvexInternal(internal.sessions.getWorkspace, {
      ownerId: session.user.id,
      sessionId: sessionId as Id<"learningSessions">,
    });

    return NextResponse.json({ turn, assistantTurn, workspace });
  } catch (error) {
    if (error instanceof ReExplainApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "The response could not be saved." },
      { status: 503 },
    );
  }
}