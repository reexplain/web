import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginDialog from "@/components/common/LoginDialog";
import { authClient } from "@/lib/auth-client";

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("redirect=/session"),
}));
jest.mock("@/lib/auth-client", () => ({
  authClient: { signIn: { social: jest.fn() } },
}));

describe("LoginDialog", () => {
  it("starts Google sign-in with the safe callback URL", async () => {
    (authClient.signIn.social as jest.Mock).mockResolvedValue({});
    render(<LoginDialog open />);

    fireEvent.click(screen.getByRole("button", { name: /sign in with google/i }));

    await waitFor(() => expect(authClient.signIn.social).toHaveBeenCalledWith(
      expect.objectContaining({ callbackURL: "/session", provider: "google" }),
    ));
  });
});
