import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders its label and variant marker", () => {
    render(<Badge variant="outline">New</Badge>);

    expect(screen.getByText("New")).toHaveAttribute("data-variant", "outline");
  });
});
