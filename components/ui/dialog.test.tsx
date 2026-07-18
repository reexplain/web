import { fireEvent, render, screen } from "@testing-library/react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

describe("Dialog", () => {
  it("opens dialog content from its trigger", () => {
    render(
      <Dialog>
        <DialogTrigger>Open session</DialogTrigger>
        <DialogContent><DialogTitle>End session?</DialogTitle></DialogContent>
      </Dialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open session" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("End session?");
  });
});
