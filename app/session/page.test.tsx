import { render, screen } from "@testing-library/react";
import SessionPage, { generateMetadata } from "@/app/session/page";
import { AUTH_REDIRECT_QUERY_PARAM } from "@/constants/auth";
import { SESSION_ROUTE } from "@/constants/routes";
import { auth } from "@/lib/auth";

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));
jest.mock("@/lib/auth", () => ({ auth: { api: { getSession: jest.fn() } } }));
jest.mock("@/components/common/TopBar", () => function TopBarMock() {
  return <header>Top bar</header>;
});
jest.mock("@/components/common/ExplainWorkflow", () => function ExplainWorkflowMock() {
  return <div>Explain workflow</div>;
});

const mockGetSession = auth.api.getSession as unknown as jest.Mock;

describe("Session page", () => {
  it("generates session-aware metadata", async () => {
    await expect(generateMetadata({ searchParams: Promise.resolve({ id: "session-1" }) })).resolves.toMatchObject({
      title: "Learning session",
    });
  });

  it("renders the explanation workflow for signed-in visitors", async () => {
    mockGetSession.mockResolvedValue({ user: { name: "Ada" } });

    render(await SessionPage());

    expect(screen.getByText("Explain workflow")).toBeInTheDocument();
  });

  it("redirects visitors who are not signed in", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(SessionPage()).rejects.toThrow(
      `redirect:/?${AUTH_REDIRECT_QUERY_PARAM}=${encodeURIComponent(SESSION_ROUTE)}`,
    );
  });
});
