import { fireEvent, render, screen } from "@testing-library/react";
import Quiz from "@/components/dashboard/Quiz";

describe("Quiz", () => {
  it("shows feedback for the selected answer", () => {
    render(<Quiz items={[
      { id: "1", excerpt: "First extracted passage.", sequence: 0 },
      { id: "2", excerpt: "Second extracted passage.", sequence: 1 },
    ]} />);

    expect(screen.getByText(/Which passage develops this idea:.*First extracted passage/)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Quiz answers" })).toHaveClass("overflow-y-auto");
    expect(screen.queryByText(/memory\.pdf|source|session/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "First extracted passage." }));

    expect(screen.getByRole("status")).toHaveTextContent("Correct.");
  });
});
