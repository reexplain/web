import { render, screen } from "@testing-library/react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

describe("Field", () => {
  it("connects field labels and errors to controls", () => {
    render(
      <Field data-invalid>
        <FieldLabel htmlFor="topic">Topic</FieldLabel>
        <Input aria-invalid id="topic" />
        <FieldError errors={[{ message: "Choose a topic" }]} />
      </Field>,
    );

    expect(screen.getByLabelText("Topic")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a topic");
  });
});
