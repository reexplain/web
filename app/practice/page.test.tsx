import { render, screen } from "@testing-library/react";
import PracticePage, { metadata } from "@/app/practice/page";
import { internal } from "@/convex/_generated/api";
import { AUTH_REDIRECT_QUERY_PARAM } from "@/constants/auth";
import { PRACTICE_PAGE_TITLE } from "@/constants/metadata";
import { PRACTICE_ROUTE } from "@/constants/routes";
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
jest.mock("@/components/common/TopBar", () => function TopBarMock() {
  return <header>Top bar</header>;
});
jest.mock("@/components/dashboard/PracticeHistory", () =>
  function PracticeHistoryMock({ batches }: { batches: Array<{ filename: string }> }) {
    return <div>History: {batches.map((batch) => batch.filename).join(", ")}</div>;
  },
);

const mockGetSession = auth.api.getSession as unknown as jest.Mock;
const mockQueryConvexInternal = queryConvexInternal as jest.Mock;

describe("Practice page", () => {
  it("declares practice metadata", () => {
    expect(metadata.title).toBe(PRACTICE_PAGE_TITLE);
  });

  it("renders every generated practice batch for the signed-in user", async () => {
    mockGetSession.mockResolvedValue({
      user: { email: "ada@example.com", id: "user-id", name: "Ada" },
    });
    mockQueryConvexInternal.mockResolvedValue([
      { filename: "Newest notes.pdf" },
      { filename: "Older notes.pdf" },
    ]);

    render(await PracticePage());

    expect(mockQueryConvexInternal).toHaveBeenCalledWith(
      internal.sessions.getPracticeHistoryForOwner,
      { ownerId: "user-id" },
    );
    expect(screen.getByRole("heading", { name: "Practice concepts" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByText("History: Newest notes.pdf, Older notes.pdf"))
      .toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Practice concepts" }).closest("main"))
      .toHaveClass("max-w-[1536px]", "mx-auto");
  });

  it("redirects visitors who are not signed in", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(PracticePage()).rejects.toThrow(
      `redirect:/?${AUTH_REDIRECT_QUERY_PARAM}=${encodeURIComponent(PRACTICE_ROUTE)}`,
    );
  });
});
