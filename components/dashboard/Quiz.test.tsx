import { fireEvent, render, screen } from "@testing-library/react";
import Quiz from "@/components/dashboard/Quiz";

describe("Quiz", () => {
  it("shows feedback for the selected answer", () => {
    render(<Quiz items={[
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
    fireEvent.click(options[0]);
    expect(screen.getByRole("status")).toHaveTextContent("Not quite. Try another answer.");

    fireEvent.click(screen.getByRole("radio", { name: "Gives each process a private and continuous address space." }));

    expect(screen.getByRole("status")).toHaveTextContent("Correct.");
  });
});
