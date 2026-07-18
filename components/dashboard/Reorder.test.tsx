import { fireEvent, render, screen } from "@testing-library/react";
import Reorder from "@/components/dashboard/Reorder";

describe("Reorder", () => {
  it("confirms the correctly ordered sequence", () => {
    render(<Reorder excerpts={[
      { id: "1", excerpt: "First extracted passage.", sequence: 0 },
      { id: "2", excerpt: "Second extracted passage.", sequence: 1 },
      { id: "3", excerpt: "Third extracted passage.", sequence: 2 },
    ]} />);

    expect(screen.getByText("Build the explanation in a logical sequence")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Reorder steps" })).toHaveClass("overflow-y-auto");
    expect(screen.queryByText(/source|session/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Move step 1 down" }));
    fireEvent.click(screen.getByRole("button", { name: "Move step 2 down" }));
    fireEvent.click(screen.getByRole("button", { name: "Move step 1 down" }));

    expect(screen.getByRole("status")).toHaveTextContent("Correct order.");
  });
});
