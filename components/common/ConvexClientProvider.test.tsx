import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { authClient } from "@/lib/auth-client";

const mockTokenFetchers: Array<() => Promise<string | null>> = [];

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: jest.fn(),
    token: jest.fn(),
  },
}));
jest.mock("convex/react", () => ({
  ConvexReactClient: jest.fn(),
  ConvexProviderWithAuth: ({ children, useAuth }: {
    children: React.ReactNode;
    useAuth: () => {
      isAuthenticated: boolean;
      fetchAccessToken: () => Promise<string | null>;
    };
  }) => {
    const auth = useAuth();
    mockTokenFetchers.push(auth.fetchAccessToken);
    return (
      <div data-authenticated={auth.isAuthenticated}>
        {children}
        <button onClick={() => void auth.fetchAccessToken()}>Fetch token</button>
      </div>
    );
  },
}));

describe("ConvexClientProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTokenFetchers.length = 0;
  });

  it("connects the Better Auth session and access token to Convex", async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
    const { default: ConvexClientProvider } = await import(
      "@/components/common/ConvexClientProvider"
    );
    (authClient.useSession as jest.Mock).mockReturnValue({
      data: { user: { id: "user-1" } },
      isPending: false,
    });
    (authClient.token as jest.Mock).mockResolvedValue({
      data: { token: "signed-token" },
    });

    render(<ConvexClientProvider><span>Dashboard</span></ConvexClientProvider>);

    expect(screen.getByText("Dashboard").parentElement).toHaveAttribute(
      "data-authenticated",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Fetch token" }));
    await waitFor(() => expect(authClient.token).toHaveBeenCalled());
  });

  it("keeps the token fetcher stable across provider rerenders", async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
    const { default: ConvexClientProvider } = await import(
      "@/components/common/ConvexClientProvider"
    );
    (authClient.useSession as jest.Mock).mockReturnValue({
      data: { user: { id: "user-1" } },
      isPending: false,
    });

    const { rerender } = render(
      <ConvexClientProvider><span>Dashboard</span></ConvexClientProvider>,
    );
    const initialFetcher = mockTokenFetchers.at(-1);

    rerender(
      <ConvexClientProvider><span>Updated dashboard</span></ConvexClientProvider>,
    );

    expect(mockTokenFetchers.at(-1)).toBe(initialFetcher);
  });
});
