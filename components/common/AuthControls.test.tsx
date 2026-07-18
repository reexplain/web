import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AuthControls from "@/components/common/AuthControls";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/lib/auth-client", () => ({ authClient: { signOut: jest.fn() } }));
jest.mock("@/components/common/LoginDialog", () => function LoginDialogMock() {
  return <button type="button">Login</button>;
});

describe("AuthControls", () => {
  it("renders the login control for signed-out visitors", () => {
    render(<AuthControls isAuthenticated={false} />);

    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("signs out and refreshes the route for signed-in visitors", async () => {
    const replace = jest.fn();
    const refresh = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace, refresh });
    (authClient.signOut as jest.Mock).mockResolvedValue(undefined);

    render(<AuthControls isAuthenticated />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(authClient.signOut).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });
});
