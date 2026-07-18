/** @jest-environment node */

import { POST } from "./route";
import { internal } from "@/convex/_generated/api";
import { auth } from "@/lib/auth";
import { mutateConvexInternal, queryConvexInternal } from "@/lib/convex-server";
import { callReExplainApi } from "@/lib/reexplain-api";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/auth", () => ({
  auth: { api: { getSession: jest.fn() } },
}));
jest.mock("@/lib/convex-server", () => ({
  mutateConvexInternal: jest.fn(),
  queryConvexInternal: jest.fn(),
}));
jest.mock("@/lib/reexplain-api", () => ({
  callReExplainApi: jest.fn(),
  isEmbeddingResult: jest.fn(),
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

describe("POST /api/learning-sessions/:sessionId/complete", () => {
  it("completes the session using the Better Auth user ID", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "better-auth-user-id" } });
    mockMutateConvexInternal.mockResolvedValue(null);
    mockCallReExplainApi.mockResolvedValue({
      model: "text-embedding-3-small",
      embeddings: [Array(1536).fill(0.01)],
    });
    mockQueryConvexInternal.mockResolvedValue({
      status: "active",
      startedAt: 100,
      turns: [],
      document: { id: "document-id", filename: "notes.pdf" },
      concepts: [{
        id: "concept-id",
        name: "Paging",
        description: "Maps virtual pages to physical frames.",
        state: "demonstrated",
        score: 80,
      }],
      evidence: [{ conceptName: "Paging" }, { conceptName: "Paging" }],
      openQuestions: [],
    });

    const response = await POST(
      new Request("http://localhost/api/learning-sessions/learning-session-id/complete", {
        method: "POST",
      }),
      context,
    );

    expect(response.status).toBe(200);
    expect(mockCallReExplainApi).toHaveBeenCalledWith(
      "/api/v1/learning/embeddings",
      expect.objectContaining({
        body: JSON.stringify({
          inputs: ["Paging\nMaps virtual pages to physical frames."],
        }),
      }),
      expect.any(Function),
    );
    expect(mockMutateConvexInternal).toHaveBeenCalledWith(internal.mastery.applyCompletedSession, {
      ownerId: "better-auth-user-id",
      sessionId: "learning-session-id",
      documentId: "document-id",
      concepts: [{
        name: "Paging",
        description: "Maps virtual pages to physical frames.",
        score: 80,
        evidenceCount: 2,
        embedding: Array(1536).fill(0.01),
      }],
    });
    await expect(response.json()).resolves.toEqual({
      status: "completed",
      workspace: expect.objectContaining({ status: "completed" }),
    });
  });
});