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
    expect(screen.getByText("Authenticated")).toBeInTheDocument();
  });
});
