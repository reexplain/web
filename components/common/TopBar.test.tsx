import { render, screen } from "@testing-library/react";
import TopBar from "@/components/common/TopBar";
import { auth } from "@/lib/auth";

jest.mock("next/headers", () => ({ headers: jest.fn().mockResolvedValue(new Headers()) }));
jest.mock("@/lib/auth", () => ({ auth: { api: { getSession: jest.fn() } } }));
jest.mock("next/image", () => function ImageMock({ alt }: { alt: string }) {
  return <span aria-label={alt} role="img" />;
});
jest.mock("@/components/common/AuthControls", () => function AuthControlsMock({ isAuthenticated }: { isAuthenticated: boolean }) {
  return <span>{isAuthenticated ? "Authenticated" : "Anonymous"}</span>;
});
jest.mock("@/components/common/ThemeToggle", () => function ThemeToggleMock() {
  return <span>Theme toggle</span>;
});

describe("TopBar", () => {
  it("links signed-in users to the dashboard", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue({ user: { name: "Ada" } });
    render(await TopBar());

    expect(screen.getByRole("link", { name: /reexplain/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByText("Authenticated")).not.toBeInTheDocument();
  });

  it("keeps the login control for signed-out visitors", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue(null);
    render(await TopBar());

    expect(screen.getByText("Anonymous")).toBeInTheDocument();
  });

  it("shows the GitHub repository link only when requested by the landing page", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue(null);
    render(await TopBar({ showGithub: true }));

    expect(screen.getByRole("link", { name: "View ReExplain on GitHub" })).toHaveAttribute(
      "href",
      "https://www.github.com/reexplain",
    );
    expect(screen.getByRole("link", { name: "View ReExplain on GitHub" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByRole("link", { name: "View ReExplain on GitHub" })).toHaveAttribute(
      "rel",
      "noreferrer",
    );
  });
});
