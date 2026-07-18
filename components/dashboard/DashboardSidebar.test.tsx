import { fireEvent, render, screen } from "@testing-library/react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

jest.mock("@/components/common/AuthControls", () =>
  function AuthControlsMock() {
    return <button type="button">Sign out</button>;
  },
);

describe("DashboardSidebar", () => {
  it("renders the dashboard section links without New PDF", () => {
    render(<DashboardSidebar />);

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
    render(<DashboardSidebar />);

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
});