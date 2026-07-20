/** @jest-environment node */

import { POST } from "./route";
import { auth } from "@/lib/auth";
import { callReExplainApi } from "@/lib/reexplain-api";

jest.mock("@/lib/auth", () => ({
  auth: { api: { getSession: jest.fn() } },
}));

jest.mock("@/lib/reexplain-api", () => ({
  callReExplainApi: jest.fn(),
  isTranscriptionResult: jest.fn(),
  ReExplainApiError: class extends Error {
    constructor(message: string, readonly status: number) {
      super(message);
    }
  },
}));

const mockGetSession = auth.api.getSession as unknown as jest.Mock;
const mockCallReExplainApi = callReExplainApi as jest.Mock;

const createRequest = (durationSeconds = "30") => {
  const form = new FormData();
  form.set("file", new File(["recorded speech"], "teaching.webm", { type: "audio/webm" }));
  form.set("durationSeconds", durationSeconds);
  return new Request("http://localhost/api/learning-sessions/session-1/transcribe", {
    method: "POST",
    body: form,
  });
};

describe("POST /api/learning-sessions/:sessionId/transcribe", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects unauthenticated recordings", async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    expect(mockCallReExplainApi).not.toHaveBeenCalled();
  });

  it("forwards a bounded recording to the transcription service", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-id" } });
    mockCallReExplainApi.mockResolvedValue({ text: "A page table maps addresses.", truncated: false });

    const response = await POST(createRequest());

    expect(response.status).toBe(200);
    expect(mockCallReExplainApi).toHaveBeenCalledWith(
      "/api/v1/learning/transcribe",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
      expect.any(Function),
    );
    await expect(response.json()).resolves.toEqual({
      text: "A page table maps addresses.",
      truncated: false,
    });
  });

  it("rejects recordings longer than three minutes", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-id" } });

    const response = await POST(createRequest("181"));

    expect(response.status).toBe(400);
    expect(mockCallReExplainApi).not.toHaveBeenCalled();
  });
});