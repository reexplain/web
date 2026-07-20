import { fireEvent, render, screen } from "@testing-library/react";
import Quiz from "@/components/dashboard/Quiz";

describe("Quiz", () => {
  it("shows feedback for the selected answer", () => {
    render(<Quiz correctItemId="1" items={[
      { id: "1", excerpt: "Virtual memory: Gives each process a private and continuous address space.", sequence: 0 },
      { id: "2", excerpt: "Scheduler: Selects the next runnable process for the processor.", sequence: 1 },
      { id: "3", excerpt: "Page table: Maps virtual pages to physical frames.", sequence: 2 },
      { id: "4", excerpt: "Cache: Keeps frequently used data close to the processor.", sequence: 3 },
    ]} />);

    expect(screen.getByText("What does Virtual memory mean?")).toBeInTheDocument();
    expect(screen.queryByText(/which passage|material|session|source/i)).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Quiz answers" })).not.toHaveClass("overflow-y-auto");
    const options = screen.getAllByRole("radio");
    expect(options).toHaveLength(4);
    expect(options[0]).not.toHaveAccessibleName(
      "Gives each process a private and continuous address space.",
    );
    const correctAnswer = screen.getByRole("radio", {
      name: "Gives each process a private and continuous address space.",
    });
    expect(correctAnswer).not.toHaveClass("bg-emerald-500", "border-emerald-500");
    expect(options[0]).toHaveClass("hover:border-border", "hover:bg-background");

    fireEvent.click(options[0]);
    expect(options[0]).toHaveClass(
      "border-destructive",
      "bg-destructive",
      "hover:border-destructive",
      "hover:bg-destructive",
      "dark:border-destructive/90",
      "dark:bg-destructive/90",
      "dark:hover:border-destructive/90",
      "dark:hover:bg-destructive/90",
    );
    expect(options[0]).not.toHaveClass("bg-red-500", "border-red-500");
    expect(correctAnswer).not.toHaveClass("bg-emerald-500", "border-emerald-500");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    fireEvent.click(correctAnswer);

    expect(correctAnswer).toHaveClass(
      "border-emerald-500",
      "bg-emerald-500",
      "hover:border-emerald-500",
      "hover:bg-emerald-500",
      "dark:border-emerald-600",
      "dark:bg-emerald-600",
      "dark:hover:border-emerald-600",
      "dark:hover:bg-emerald-600",
    );
  });
});
