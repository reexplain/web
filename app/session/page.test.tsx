import { render, screen } from "@testing-library/react";
import SessionPage, { generateMetadata } from "@/app/session/page";
import { AUTH_REDIRECT_QUERY_PARAM } from "@/constants/auth";
import { SESSION_ROUTE } from "@/constants/routes";
import { auth } from "@/lib/auth";
import type { ExplainWorkflowProps } from "@/types/pdf";

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
jest.mock("@/components/common/ExplainWorkflow", () => function ExplainWorkflowMock({
  existingSessionId,
  initialView,
}: ExplainWorkflowProps) {
  return <div>Explain workflow: {existingSessionId} · {initialView}</div>;
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

    const workflow = screen.getByText(/Explain workflow/);
    expect(workflow).toBeInTheDocument();
    expect(workflow.parentElement).toHaveClass("w-full", "min-w-0");
    expect(workflow.closest("main")).toHaveClass("w-full", "min-h-0", "max-w-[1536px]", "mx-auto");
  });

  it("opens a requested saved-session summary", async () => {
    mockGetSession.mockResolvedValue({ user: { name: "Ada" } });

    render(await SessionPage({
      searchParams: Promise.resolve({ id: "session-1", view: "summary" }),
    }));

    expect(
      screen.getByText("Explain workflow: session-1 · summary"),
    ).toBeInTheDocument();
  });

  it("redirects visitors who are not signed in", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(SessionPage()).rejects.toThrow(
      `redirect:/?${AUTH_REDIRECT_QUERY_PARAM}=${encodeURIComponent(SESSION_ROUTE)}`,
    );
  });
});
