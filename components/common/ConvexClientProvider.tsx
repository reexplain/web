"use client";

import type { ReactNode } from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured.");
}

const convex = new ConvexReactClient(convexUrl);

const useBetterAuth = () => {
  const { data: session, isPending } = authClient.useSession();

  return {
    isLoading: isPending,
    isAuthenticated: Boolean(session),
    fetchAccessToken: async () => {
      const { data } = await authClient.token();
      return data?.token ?? null;
    },
  };
};

const ConvexClientProvider = ({ children }: { children: ReactNode }) => (
  <ConvexProviderWithAuth client={convex} useAuth={useBetterAuth}>
    {children}
  </ConvexProviderWithAuth>
);

export default ConvexClientProvider;