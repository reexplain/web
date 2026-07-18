/** @jest-environment node */

import { POST } from "./route";
import { auth } from "@/lib/auth";
import { mutateConvexInternal, queryConvexInternal } from "@/lib/convex-server";
import { callReExplainApi, ReExplainApiError } from "@/lib/reexplain-api";

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock("@/lib/convex-server", () => ({
  mutateConvexInternal: jest.fn(),
  queryConvexInternal: jest.fn(),
}));
jest.mock("@/lib/reexplain-api", () => ({
  callReExplainApi: jest.fn(),
  isEmbeddingResult: jest.fn(),
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

const createUploadRequest = () => {
  const form = new FormData();
  form.set(
    "file",
    new File(["%PDF-test"], "notes.pdf", { type: "application/pdf" }),
  );

  return new Request("http://localhost/api/pdf/extract", {
    method: "POST",
    body: form,
  });
};

describe("POST /api/pdf/extract", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects unauthenticated uploads before calling external services", async () => {
    mockGetSession.mockResolvedValue(null);
    const fetchSpy = jest.spyOn(global, "fetch");

    const response = await POST(createUploadRequest());

    expect(response.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockMutateConvexInternal).not.toHaveBeenCalled();
  });

  it("preserves document-service errors for the frontend", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "better-auth-user-id" } });
    mockCallReExplainApi.mockRejectedValueOnce(
      new ReExplainApiError("PDF files must contain 25 pages or fewer.", 422),
    );

    const response = await POST(createUploadRequest());

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "PDF files must contain 25 pages or fewer.",
    });
  });

  it("persists an authenticated extraction under the session user", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "better-auth-user-id" },
      session: { id: "session-id" },
    });
    jest.spyOn(global, "fetch").mockResolvedValueOnce(
      Response.json({ storageId: "storage-id" }),
    );
    mockCallReExplainApi
      .mockResolvedValueOnce({
        filename: "notes.pdf",
        page_count: 1,
        text: "Private extracted text",
        pages: [{ page_number: 1, text: "Private extracted text" }],
      })
      .mockResolvedValueOnce({
        model: "text-embedding-3-small",
        embeddings: [[0]],
      })
      .mockResolvedValueOnce({
        content: "What is the document's main claim?",
        interaction_type: "explain",
        active_concept: "Main claim",
        concepts: [{
          name: "Main claim",
          description: "The central claim.",
          state: "unexplored",
          score: 0,
        }],
        evidence: [],
        open_questions: [],
        understanding_score: 0,
        summary: "The session is ready to begin.",
      });
    mockQueryConvexInternal
      .mockResolvedValueOnce([
        { id: "chunk-id", sequence: 0, text: "Private extracted text" },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({
        documentChunks: ["Private extracted text"],
        history: [],
      });
    mockMutateConvexInternal
      .mockResolvedValueOnce("https://convex.example/upload")
      .mockResolvedValueOnce("document-id")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("learning-session-id")
      .mockResolvedValue(null);

    const response = await POST(createUploadRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      filename: "notes.pdf",
      page_count: 1,
      document_id: "document-id",
      learning_session_id: "learning-session-id",
    });
    expect(JSON.stringify(body)).not.toContain("Private extracted text");
    expect(mockMutateConvexInternal).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({ ownerId: "better-auth-user-id" }),
    );
    expect(mockMutateConvexInternal).toHaveBeenNthCalledWith(
      3,
      expect.anything(),
      expect.objectContaining({
        ownerId: "better-auth-user-id",
        documentId: "document-id",
      }),
    );
    expect(mockMutateConvexInternal).toHaveBeenNthCalledWith(
      4,
      expect.anything(),
      expect.objectContaining({
        ownerId: "better-auth-user-id",
        documentId: "document-id",
      }),
    );
    expect(mockCallReExplainApi).toHaveBeenCalledTimes(3);
  });
});