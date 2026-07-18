/** @jest-environment node */

import { GET } from "./route";
import { auth } from "@/lib/auth";
import { queryConvexInternal } from "@/lib/convex-server";

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock("@/lib/convex-server", () => ({
  queryConvexInternal: jest.fn(),
}));

const mockGetSession = auth.api.getSession as unknown as jest.Mock;
const mockQueryConvexInternal = queryConvexInternal as jest.Mock;

describe("GET /api/documents", () => {
  it("rejects unauthenticated requests before calling Convex", async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/documents"));

    expect(response.status).toBe(401);
    expect(mockQueryConvexInternal).not.toHaveBeenCalled();
  });

  it("derives document ownership from the Better Auth session", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "better-auth-user-id" },
      session: { id: "session-id" },
    });
    mockQueryConvexInternal.mockResolvedValue([]);

    const response = await GET(new Request("http://localhost/api/documents"));

    expect(response.status).toBe(200);
    expect(mockQueryConvexInternal).toHaveBeenCalledWith(expect.anything(), {
      ownerId: "better-auth-user-id",
    });
    await expect(response.json()).resolves.toEqual({ documents: [] });
  });
});