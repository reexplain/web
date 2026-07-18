import { fireEvent, render, screen } from "@testing-library/react";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("forwards entered values", () => {
    render(<Input aria-label="Document title" />);
    const input = screen.getByLabelText("Document title");

    fireEvent.change(input, { target: { value: "Memory notes" } });

    expect(input).toHaveValue("Memory notes");
  });
});
