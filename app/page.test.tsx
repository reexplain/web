import { render, screen } from "@testing-library/react";
import Home, { metadata } from "@/app/page";
import { AUTH_DEFAULT_REDIRECT } from "@/constants/auth";
import { HOME_PAGE_TITLE } from "@/constants/metadata";
import { auth } from "@/lib/auth";

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

jest.mock("@/lib/auth", () => ({
  auth: { api: { getSession: jest.fn() } },
}));

jest.mock("@/components/common/TopBar", () => function TopBarMock() {
  return <header>Top bar</header>;
});
jest.mock("@/components/common/PdfUploadBox", () => function PdfUploadBoxMock({ isAuthenticated }: { isAuthenticated: boolean }) {
  return <div data-testid="pdf-upload-box">{String(isAuthenticated)}</div>;
});

const mockGetSession = auth.api.getSession as unknown as jest.Mock;

describe("Home page", () => {
  it("declares page-specific metadata", () => {
    expect(metadata.title).toBe(HOME_PAGE_TITLE);
  });

  it("renders the learning prompt for signed-out visitors", async () => {
    mockGetSession.mockResolvedValue(null);

    render(await Home());

    expect(screen.getByRole("heading", { name: /find out what you actually understand/i })).toBeInTheDocument();
    expect(screen.getByTestId("pdf-upload-box")).toHaveTextContent("false");
  });

  it("redirects signed-in visitors to the dashboard", async () => {
    mockGetSession.mockResolvedValue({ user: { name: "Ada" } });

    await expect(Home()).rejects.toThrow(`redirect:${AUTH_DEFAULT_REDIRECT}`);
  });
});
