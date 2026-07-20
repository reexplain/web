import { act, render, screen } from "@testing-library/react";
import ExplainWorkflow from "@/components/common/ExplainWorkflow";
import { getStagedPdf } from "@/lib/staged-pdf";
import type { SessionWorkspaceProps } from "@/types/session";

jest.mock("@/components/common/SessionWorkspace", () => function SessionWorkspaceMock({
  initialView,
  learningSessionId,
}: SessionWorkspaceProps) {
  return <div>Workspace: {learningSessionId} · View: {initialView}</div>;
});
jest.mock("@/lib/staged-pdf", () => ({
  clearStagedPdf: jest.fn(),
  getStagedPdf: jest.fn(),
}));

const mockGetStagedPdf = getStagedPdf as jest.Mock;

describe("ExplainWorkflow", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("opens an existing learning session without starting PDF extraction", () => {
    render(<ExplainWorkflow existingSessionId="session-1" />);

    expect(screen.getByText(/Workspace: session-1/)).toBeInTheDocument();
  });

  it("opens an existing session in its full summary view", () => {
    render(<ExplainWorkflow existingSessionId="session-1" initialView="summary" />);

    expect(screen.getByText("Workspace: session-1 · View: summary")).toBeInTheDocument();
  });

  it("cycles through PDF processing stages", () => {
    jest.useFakeTimers();
    mockGetStagedPdf.mockImplementation(() => new Promise(() => undefined));

    render(<ExplainWorkflow />);

    expect(screen.getByText("Reading your PDF")).toBeInTheDocument();
    expect(
      screen.getByText("Preparing your learning session. This usually takes about a minute."),
    ).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(3_500));
    expect(screen.getByText("Extracting document structure")).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(3_500));
    expect(screen.getByText("Extracting key concepts")).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(3_500));
    expect(screen.getByText("Reading your PDF")).toBeInTheDocument();
  });

  it("shows a clear retry message when session preparation fails", async () => {
    mockGetStagedPdf.mockResolvedValue(null);

    render(<ExplainWorkflow />);

    expect(await screen.findByRole("heading", { name: "Something went wrong" }))
      .toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something went wrong while preparing your learning session. Please try again.",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows the learning-material validation error from the PDF service", async () => {
    mockGetStagedPdf.mockResolvedValue(
      new File(["pdf"], "invoice.pdf", { type: "application/pdf" }),
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error:
          "This PDF does not seem to contain learning material suitable for a learning session.",
      }),
    } as Response);

    render(<ExplainWorkflow />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This PDF does not seem to contain learning material suitable for a learning session.",
    );
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Choose another PDF" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("does not offer retry when the PDF has no extractable text", async () => {
    mockGetStagedPdf.mockResolvedValue(
      new File(["pdf"], "scan.pdf", { type: "application/pdf" }),
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "The PDF does not contain extractable text." }),
    } as Response);

    render(<ExplainWorkflow />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The PDF does not contain extractable text.",
    );
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Choose another PDF" })).toBeInTheDocument();
  });
});
