import { fireEvent, render, screen } from "@testing-library/react";
import Flashcard from "@/components/dashboard/Flashcard";

describe("Flashcard", () => {
  it("flips between the centered question and answer", () => {
    render(<Flashcard item={{
      id: "1",
      excerpt: "A page table maps virtual pages to physical frames.",
      sequence: 0,
    }} />);

    const flashcard = screen.getByRole("button", { name: /flashcard question/i });
    expect(flashcard).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/Explain this idea in your own words:/)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Flashcard prompt" })).toHaveClass("overflow-y-auto");
    expect(screen.queryByText(/page 3|memory\.pdf|source/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("flashcard-answer")).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(flashcard);
    expect(screen.getByRole("button", { name: /flashcard answer/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("flashcard-answer")).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByText("A page table maps virtual pages to physical frames.")).toBeInTheDocument();
    expect(screen.queryByText(/session|understanding score/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /flashcard answer/i }));
    expect(screen.getByTestId("flashcard-answer")).toHaveAttribute("aria-hidden", "true");
  });
});
