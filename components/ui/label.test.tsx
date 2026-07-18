import { render, screen } from "@testing-library/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

describe("Label", () => {
  it("labels its associated control", () => {
    render(<><Label htmlFor="answer">Answer</Label><Input id="answer" /></>);

    expect(screen.getByLabelText("Answer")).toHaveAttribute("id", "answer");
  });
});
