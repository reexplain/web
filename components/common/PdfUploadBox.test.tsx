import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PdfUploadBox from "@/components/common/PdfUploadBox";
import { stagePdf } from "@/lib/staged-pdf";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/lib/staged-pdf", () => ({ stagePdf: jest.fn() }));
jest.mock("@/components/common/LoginDialog", () => function LoginDialogMock() {
  return null;
});

describe("PdfUploadBox", () => {
  it("shows a validation error for a non-PDF file", () => {
    const { container } = render(<PdfUploadBox isAuthenticated />);
    const input = container.querySelector("input[type=file]");

    if (!input) throw new Error("Expected the PDF file input to render.");

    fireEvent.change(input, { target: { files: [new File(["text"], "notes.txt", { type: "text/plain" })] } });

    expect(screen.getByRole("alert")).toHaveTextContent("Choose a PDF file to continue.");
  });

  it("stages a PDF and opens the session for authenticated users", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    (stagePdf as jest.Mock).mockResolvedValue(undefined);
    const { container } = render(<PdfUploadBox isAuthenticated />);
    const input = container.querySelector("input[type=file]");

    if (!input) throw new Error("Expected the PDF file input to render.");

    fireEvent.change(input, {
      target: { files: [new File(["pdf"], "study.pdf", { type: "application/pdf" })] },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Begin a learning session" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/session"));
    expect(stagePdf).toHaveBeenCalled();
  });
});
