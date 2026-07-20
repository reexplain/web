import { render, screen } from "@testing-library/react";
import ThemeProvider from "@/components/common/ThemeProvider";

describe("ThemeProvider", () => {
  it("renders theme-aware content without injecting a script", () => {
    render(
      <ThemeProvider>
        <span data-testid="theme-provider">Theme-aware content</span>
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-provider")).toHaveTextContent("Theme-aware content");
    expect(document.querySelector("script")).not.toBeInTheDocument();
  });
});
