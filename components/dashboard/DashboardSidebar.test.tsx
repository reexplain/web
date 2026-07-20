import { fireEvent, render, screen } from "@testing-library/react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

jest.mock("@/components/common/AuthControls", () =>
  function AuthControlsMock({ iconOnly }: { iconOnly?: boolean }) {
    return (
      <button aria-label={iconOnly ? "Mobile sign out" : undefined} type="button">
        {iconOnly ? <span aria-hidden="true">icon</span> : "Sign out"}
      </button>
    );
  },
);
jest.mock("@/components/common/ThemeToggle", () => function ThemeToggleMock() {
  return <span>Theme toggle</span>;
});

describe("DashboardSidebar", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    window.history.replaceState(null, "", "/dashboard");
  });

  it("renders the dashboard section links without New PDF", () => {
    render(<DashboardSidebar user={{ email: "ada@example.com", name: "Ada Lovelace" }} />);

    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "#overview",
    );
    expect(screen.getByRole("link", { name: "Mastery map" })).toHaveAttribute(
      "href",
      "#mastery-graph",
    );
    expect(screen.getByRole("link", { name: "Practice" })).toHaveAttribute(
      "href",
      "#practice",
    );
    expect(screen.getByRole("link", { name: "Sessions" })).toHaveAttribute(
      "href",
      "#saved-sessions",
    );
    expect(screen.queryByRole("link", { name: "New PDF" })).not.toBeInTheDocument();
  });

  it("marks the clicked section active while preserving its anchor", () => {
    render(<DashboardSidebar user={{ email: "ada@example.com", name: "Ada Lovelace" }} />);

    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "location",
    );

    const practiceLink = screen.getByRole("link", { name: "Practice" });
    fireEvent.click(practiceLink);

    expect(practiceLink).toHaveAttribute("href", "#practice");
    expect(practiceLink).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("scrolls Overview to the absolute page top", () => {
    render(<DashboardSidebar user={{ email: "ada@example.com", name: "Ada Lovelace" }} />);

    fireEvent.click(screen.getByRole("link", { name: "Overview" }));

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(window.location.hash).toBe("#overview");
  });

  it("shows the signed-in user's details above sign out", () => {
    render(<DashboardSidebar user={{ email: "ada@example.com", name: "Ada Lovelace" }} />);

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Ada Lovelace profile initials" })).toHaveLength(2);
    expect(screen.getAllByRole("img", { name: "Ada Lovelace profile initials" })[0]).toHaveTextContent("AL");
    expect(screen.getByText("ada@example.com")).toHaveAttribute("title", "ada@example.com");
    expect(screen.getByRole("button", { name: "Mobile sign out" })).toHaveTextContent("icon");
  });

  it("shows the user's profile photo when available", () => {
    render(<DashboardSidebar user={{
      email: "ada@example.com",
      image: "https://lh3.googleusercontent.com/photo.jpg",
      name: "Ada Lovelace",
    }} />);

    expect(screen.getAllByRole("img", { name: "Ada Lovelace profile photo" })).toHaveLength(2);
  });
});
