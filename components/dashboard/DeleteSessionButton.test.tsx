import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import DeleteSessionButton from "@/components/dashboard/DeleteSessionButton";

jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

describe("DeleteSessionButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("confirms and deletes the selected session", async () => {
    const onDeleted = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "deleted" }) });
    render(<DeleteSessionButton filename="memory.pdf" onDeleted={onDeleted} sessionId="session-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Delete session for memory.pdf" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("memory.pdf");
    fireEvent.click(screen.getByRole("button", { name: "Delete session" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/learning-sessions/session-1", {
        method: "DELETE",
      });
      expect(onDeleted).toHaveBeenCalledWith("session-1");
      expect(toast.success).toHaveBeenCalledWith("Session deleted.");
    });
  });

  it("shows deletion errors in a toast", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Deletion failed." }),
    });
    render(<DeleteSessionButton filename="memory.pdf" onDeleted={jest.fn()} sessionId="session-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Delete session for memory.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete session" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Deletion failed.");
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});