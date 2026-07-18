/** @jest-environment node */

import { DELETE, GET } from "./route";
import { internal } from "@/convex/_generated/api";
import { auth } from "@/lib/auth";
import { mutateConvexInternal, queryConvexInternal } from "@/lib/convex-server";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

jest.mock("@/lib/auth", () => ({
  auth: { api: { getSession: jest.fn() } },
}));

jest.mock("@/lib/convex-server", () => ({
  mutateConvexInternal: jest.fn(),
  queryConvexInternal: jest.fn(),
}));

const mockGetSession = auth.api.getSession as unknown as jest.Mock;
const mockMutateConvexInternal = mutateConvexInternal as jest.Mock;
const mockQueryConvexInternal = queryConvexInternal as jest.Mock;
const context = { params: Promise.resolve({ sessionId: "learning-session-id" }) };

describe("GET /api/learning-sessions/:sessionId", () => {
  it("rejects unauthenticated requests", async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/learning-sessions/learning-session-id"),
      context,
    );

    expect(response.status).toBe(401);
    expect(mockQueryConvexInternal).not.toHaveBeenCalled();
  });

  it("loads the session using the Better Auth user ID", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "better-auth-user-id" } });
    mockQueryConvexInternal.mockResolvedValue({ status: "active", turns: [] });

    const response = await GET(
      new Request("http://localhost/api/learning-sessions/learning-session-id"),
      context,
    );

    expect(response.status).toBe(200);
    expect(mockQueryConvexInternal).toHaveBeenCalledWith(expect.anything(), {
      ownerId: "better-auth-user-id",
      sessionId: "learning-session-id",
    });
  });

  it("reactivates a legacy unfinished session when it is opened", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "better-auth-user-id" } });
    mockQueryConvexInternal.mockResolvedValue({ status: "abandoned", turns: [] });
    mockMutateConvexInternal.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/learning-sessions/learning-session-id"),
      context,
    );

    expect(mockMutateConvexInternal).toHaveBeenCalledWith(
      internal.sessions.resumeLegacySession,
      { ownerId: "better-auth-user-id", sessionId: "learning-session-id" },
    );
    await expect(response.json()).resolves.toMatchObject({ status: "active" });
  });
});

describe("DELETE /api/learning-sessions/:sessionId", () => {
  it("deletes the session using the Better Auth user ID", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "better-auth-user-id" } });
    mockMutateConvexInternal.mockResolvedValue(null);
    mockQueryConvexInternal.mockResolvedValue({
      status: "active",
      startedAt: 100,
      turns: [],
      concepts: [],
      evidence: [],
      openQuestions: [],
    });

    const response = await DELETE(
      new Request("http://localhost/api/learning-sessions/learning-session-id", {
        method: "DELETE",
      }),
      context,
    );

    expect(response.status).toBe(200);
    expect(mockMutateConvexInternal).toHaveBeenCalledWith(internal.sessions.deleteSession, {
      ownerId: "better-auth-user-id",
      sessionId: "learning-session-id",
    });
    await expect(response.json()).resolves.toEqual({ status: "deleted" });
  });

  it("does not report failure when dashboard revalidation fails", async () => {
    const { revalidatePath } = jest.requireMock("next/cache") as {
      revalidatePath: jest.Mock;
    };
    revalidatePath.mockImplementationOnce(() => {
      throw new Error("cache unavailable");
    });
    mockGetSession.mockResolvedValue({ user: { id: "better-auth-user-id" } });
    mockQueryConvexInternal.mockResolvedValue({
      status: "active",
      startedAt: 100,
      turns: [],
      concepts: [],
      evidence: [],
      openQuestions: [],
    });
    mockMutateConvexInternal.mockResolvedValue(null);

    const response = await DELETE(
      new Request("http://localhost/api/learning-sessions/learning-session-id", {
        method: "DELETE",
      }),
      context,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "deleted" });
  });
});