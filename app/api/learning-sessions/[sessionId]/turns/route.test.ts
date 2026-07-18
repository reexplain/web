/** @jest-environment node */

import { POST } from "./route";
import { auth } from "@/lib/auth";
import { mutateConvexInternal, queryConvexInternal } from "@/lib/convex-server";
import { callReExplainApi, ReExplainApiError } from "@/lib/reexplain-api";

jest.mock("@/lib/auth", () => ({
  auth: { api: { getSession: jest.fn() } },
}));

jest.mock("@/lib/convex-server", () => ({
  mutateConvexInternal: jest.fn(),
  queryConvexInternal: jest.fn(),
}));
jest.mock("@/lib/reexplain-api", () => ({
  callReExplainApi: jest.fn(),
  isLearningTurnResult: jest.fn(),
  ReExplainApiError: class extends Error {
    constructor(message: string, readonly status: number) {
      super(message);
    }
  },
}));

const mockGetSession = auth.api.getSession as unknown as jest.Mock;
const mockMutateConvexInternal = mutateConvexInternal as jest.Mock;
const mockQueryConvexInternal = queryConvexInternal as jest.Mock;
const mockCallReExplainApi = callReExplainApi as jest.Mock;
const context = { params: Promise.resolve({ sessionId: "learning-session-id" }) };

const createRequest = (body: unknown) =>
  new Request(
    "http://localhost/api/learning-sessions/learning-session-id/turns",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

describe("POST /api/learning-sessions/:sessionId/turns", () => {
  it("rejects unauthenticated requests", async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await POST(
      createRequest({ content: "My answer", requestId: "request-id" }),
      context,
    );

    expect(response.status).toBe(401);
    expect(mockMutateConvexInternal).not.toHaveBeenCalled();
  });

  it("stores a learner turn using the Better Auth user ID", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "better-auth-user-id" } });
    mockMutateConvexInternal.mockResolvedValue({
      id: "turn-id",
      role: "learner",
      content: "My answer",
    });
    mockQueryConvexInternal
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        documentChunks: ["Private source text"],
        history: [{ role: "learner", content: "My answer" }],
      })
      .mockResolvedValueOnce({
        document: { filename: "notes.pdf" },
        turns: [],
        concepts: [],
        openQuestions: [],
      });
    mockCallReExplainApi.mockResolvedValue({
      content: "What supports that conclusion?",
      interaction_type: "probe",
      active_concept: "Main claim",
      concepts: [{
        name: "Main claim",
        description: "The document's central claim.",
        state: "developing",
        score: 40,
      }],
      evidence: [],
      open_questions: [],
      understanding_score: 40,
      summary: "The learner identified the main claim.",
    });

    const response = await POST(
      createRequest({ content: "  My answer  ", requestId: "request-id" }),
      context,
    );

    expect(response.status).toBe(200);
    expect(mockMutateConvexInternal).toHaveBeenCalledWith(expect.anything(), {
      ownerId: "better-auth-user-id",
      sessionId: "learning-session-id",
      content: "My answer",
      requestId: "request-id",
    });
    expect(mockCallReExplainApi).toHaveBeenCalledWith(
      "/api/v1/learning/turn",
      expect.objectContaining({ method: "POST" }),
      expect.any(Function),
    );
  });

  it("preserves learning-service errors for the frontend", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "better-auth-user-id" } });
    mockMutateConvexInternal.mockResolvedValue({ id: "turn-id" });
    mockQueryConvexInternal
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        documentChunks: ["Private source text"],
        history: [{ role: "learner", content: "My answer" }],
      });
    mockCallReExplainApi.mockRejectedValueOnce(
      new ReExplainApiError("The learning model is busy. Try again shortly.", 429),
    );

    const response = await POST(
      createRequest({ content: "My answer", requestId: "request-id" }),
      context,
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "The learning model is busy. Try again shortly.",
    });
  });
});