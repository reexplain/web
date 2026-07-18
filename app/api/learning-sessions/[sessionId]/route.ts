import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { internal } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { auth } from "@/lib/auth";
import { mutateConvexInternal, queryConvexInternal } from "@/lib/convex-server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { sessionId } = await context.params;

  try {
    const workspace = await queryConvexInternal(internal.sessions.getWorkspace, {
      ownerId: session.user.id,
      sessionId: sessionId as Id<"learningSessions">,
    });

    if (!workspace) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    if (workspace.status === "abandoned") {
      await mutateConvexInternal(internal.sessions.resumeLegacySession, {
        ownerId: session.user.id,
        sessionId: sessionId as Id<"learningSessions">,
      });
      return NextResponse.json({ ...workspace, status: "active" });
    }

    return NextResponse.json(workspace);
  } catch {
    return NextResponse.json(
      { error: "The learning session is currently unavailable." },
      { status: 503 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const confidenceScore =
    body && typeof body === "object" && "confidenceScore" in body
      ? body.confidenceScore
      : null;
  if (
    typeof confidenceScore !== "number" ||
    !Number.isInteger(confidenceScore) ||
    confidenceScore < 0 ||
    confidenceScore > 10
  ) {
    return NextResponse.json({ error: "Confidence must be an integer from 0 to 10." }, { status: 400 });
  }

  const { sessionId } = await context.params;
  try {
    await mutateConvexInternal(internal.sessions.updateConfidence, {
      ownerId: session.user.id,
      sessionId: sessionId as Id<"learningSessions">,
      confidenceScore,
    });
    return NextResponse.json({ confidenceScore });
  } catch {
    return NextResponse.json({ error: "Confidence could not be saved." }, { status: 503 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { sessionId } = await context.params;
  try {
    const workspace = await queryConvexInternal(internal.sessions.getWorkspace, {
      ownerId: session.user.id,
      sessionId: sessionId as Id<"learningSessions">,
    });
    if (!workspace) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    await mutateConvexInternal(internal.sessions.deleteSession, {
      ownerId: session.user.id,
      sessionId: sessionId as Id<"learningSessions">,
    });

    try {
      revalidatePath("/dashboard");
    } catch {
      // Deletion is authoritative even if cache invalidation is unavailable.
    }
    return NextResponse.json({ status: "deleted" });
  } catch {
    return NextResponse.json({ error: "The session could not be deleted." }, { status: 503 });
  }
}