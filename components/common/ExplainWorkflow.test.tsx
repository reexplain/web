import { act, render, screen } from "@testing-library/react";
import ExplainWorkflow from "@/components/common/ExplainWorkflow";
import { getStagedPdf } from "@/lib/staged-pdf";

jest.mock("@/components/common/SessionWorkspace", () => function SessionWorkspaceMock({ learningSessionId }: { learningSessionId: string }) {
  return <div>Workspace: {learningSessionId}</div>;
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

    expect(screen.getByText("Workspace: session-1")).toBeInTheDocument();
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
});
