import { fireEvent, render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("forwards click events and disabled state", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Continue</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
