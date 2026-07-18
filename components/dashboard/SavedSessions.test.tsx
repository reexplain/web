import { fireEvent, render, screen } from "@testing-library/react";
import { useConvexAuth, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import SavedSessions from "@/components/dashboard/SavedSessions";

jest.mock("convex/react", () => ({
  useConvexAuth: jest.fn(),
  useQuery: jest.fn(),
}));
jest.mock("@/components/dashboard/DeleteSessionButton", () =>
  function DeleteSessionButtonMock({ filename, onDeleted, sessionId }: {
    filename: string;
    onDeleted: (sessionId: string) => void;
    sessionId: string;
  }) {
    return <button onClick={() => onDeleted(sessionId)}>Delete {filename}</button>;
  },
);

const mockUseQuery = useQuery as jest.Mock;
const mockUseConvexAuth = useConvexAuth as jest.Mock;
const initialSessions = [{
  id: "session-1" as Id<"learningSessions">,
  documentId: "document-1" as Id<"documents">,
  filename: "initial.pdf",
  pageCount: 4,
  status: "active" as const,
  documentStatus: "ready" as const,
  updatedAt: 1,
}];

describe("SavedSessions", () => {
  it("uses the server result while the Convex subscription connects", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    mockUseQuery.mockReturnValue(undefined);

    render(<SavedSessions initialSessions={initialSessions} />);

    expect(mockUseQuery).toHaveBeenCalledWith(api.sessions.listCurrentUser, "skip");
    expect(screen.getByText("initial.pdf")).toBeInTheDocument();
    expect(screen.getByText("1 session")).toBeInTheDocument();
  });

  it("replaces stale sessions with the live Convex result", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue([]);

    render(<SavedSessions initialSessions={initialSessions} />);

    expect(mockUseQuery).toHaveBeenCalledWith(api.sessions.listCurrentUser, {});
    expect(screen.queryByText("initial.pdf")).not.toBeInTheDocument();
    expect(screen.getByText("No saved sessions yet")).toBeInTheDocument();
    expect(screen.getByText("0 sessions")).toBeInTheDocument();
  });

  it("removes a confirmed deletion before the subscription refreshes", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue(initialSessions);

    render(<SavedSessions initialSessions={initialSessions} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete initial.pdf" }));

    expect(screen.queryByText("initial.pdf")).not.toBeInTheDocument();
    expect(screen.getByText("No saved sessions yet")).toBeInTheDocument();
  });

  it("keeps legacy unfinished sessions labeled as in progress", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue([{ ...initialSessions[0], status: "abandoned" }]);

    render(<SavedSessions initialSessions={initialSessions} />);

    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.queryByText("Ended")).not.toBeInTheDocument();
  });
});