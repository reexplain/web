import { render } from "@testing-library/react";
import { Separator } from "@/components/ui/separator";

describe("Separator", () => {
  it("uses the requested orientation", () => {
    const { container } = render(<Separator orientation="vertical" />);

    expect(container.firstChild).toHaveAttribute("data-orientation", "vertical");
  });
});
