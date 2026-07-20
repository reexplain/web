import { fireEvent, render, screen } from "@testing-library/react";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useTheme } from "@/components/common/ThemeProvider";

jest.mock("@/components/common/ThemeProvider", () => ({ useTheme: jest.fn() }));

describe("ThemeToggle", () => {
  it("switches from light mode to dark mode", () => {
    const setTheme = jest.fn();
    (useTheme as jest.Mock).mockReturnValue({ theme: "light", setTheme });

    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("switches from dark mode to light mode", () => {
    const setTheme = jest.fn();
    (useTheme as jest.Mock).mockReturnValue({ theme: "dark", setTheme });

    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));

    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
