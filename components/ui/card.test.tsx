import { render, screen } from "@testing-library/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

describe("Card", () => {
  it("renders its composed sections", () => {
    render(
      <Card>
        <CardHeader><CardTitle>Session</CardTitle></CardHeader>
        <CardContent>Ready to learn</CardContent>
      </Card>,
    );

    expect(screen.getByText("Session")).toHaveAttribute("data-slot", "card-title");
    expect(screen.getByText("Ready to learn")).toHaveAttribute("data-slot", "card-content");
  });
});
