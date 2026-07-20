import { render, screen } from "@testing-library/react";
import DashboardPage, { generateMetadata } from "@/app/dashboard/page";
import { internal } from "@/convex/_generated/api";
import { AUTH_DEFAULT_REDIRECT, AUTH_REDIRECT_QUERY_PARAM } from "@/constants/auth";
import { auth } from "@/lib/auth";
import { queryConvexInternal } from "@/lib/convex-server";

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));
jest.mock("@/lib/auth", () => ({ auth: { api: { getSession: jest.fn() } } }));
jest.mock("@/lib/convex-server", () => ({ queryConvexInternal: jest.fn() }));
jest.mock("@/components/dashboard/DashboardSidebar", () =>
  function DashboardSidebarMock({ user }: { user: { email: string; name: string } }) {
    return <aside>{user.name} · {user.email}</aside>;
  },
);
jest.mock("@/components/common/PdfUploadBox", () =>
  function PdfUploadBoxMock() {
    return <div>PDF upload</div>;
  },
);
jest.mock("@/components/dashboard/DashboardRealtime", () =>
  function DashboardRealtimeMock() {
    return (
      <>
        <h2>Mastery map</h2>
        <h2>Practice concepts</h2>
        <h2>Saved learning sessions</h2>
      </>
    );
  },
);

const mockGetSession = auth.api.getSession as unknown as jest.Mock;
const mockQueryConvexInternal = queryConvexInternal as jest.Mock;

describe("Dashboard page", () => {
  it("generates a personalized dashboard title", async () => {
    mockGetSession.mockResolvedValue({ user: { email: "ada@example.com", id: "user-id", name: "Ada" } });

    await expect(generateMetadata()).resolves.toMatchObject({
      title: "Ada's Dashboard",
    });
  });

  it("renders the signed-in user's dashboard", async () => {
    mockGetSession.mockResolvedValue({
      user: { email: "ada@example.com", id: "user-id", name: "Ada" },
    });
    mockQueryConvexInternal.mockResolvedValue({
      sessions: [],
      practiceExcerpts: [],
      masteryGraph: { nodes: [], edges: [] },
    });

    render(await DashboardPage());

    expect(mockQueryConvexInternal).toHaveBeenCalledWith(
      internal.sessions.getDashboardForOwner,
      { ownerId: "user-id" },
    );
    expect(screen.getByRole("heading", { name: "Welcome back, Ada." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What are you learning next?" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mastery map" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Saved learning sessions" })).toBeInTheDocument();
    expect(screen.getByText("Ada · ada@example.com")).toBeInTheDocument();
  });

  it("does not disguise a failed Convex read as an empty dashboard", async () => {
    mockGetSession.mockResolvedValue({
      user: { email: "ada@example.com", id: "user-id", name: "Ada" },
    });
    mockQueryConvexInternal.mockRejectedValue(new Error("Dashboard query unavailable"));

    await expect(DashboardPage()).rejects.toThrow("Dashboard query unavailable");
  });

  it("redirects visitors who are not signed in", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(DashboardPage()).rejects.toThrow(
      `redirect:/?${AUTH_REDIRECT_QUERY_PARAM}=${encodeURIComponent(AUTH_DEFAULT_REDIRECT)}`,
    );
  });
});
