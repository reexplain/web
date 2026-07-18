import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins/jwt";
import { authPool } from "@/lib/db";
import { APP_NAME } from "@/constants/app";

const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  appName: APP_NAME,
  database: authPool,
  trustedOrigins,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      prompt: "select_account",
    },
  },
  account: {
    encryptOAuthTokens: true,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
  },
  plugins: [
    jwt({
      jwks: {
        keyPairConfig: { alg: "ES256" },
      },
    }),
    nextCookies(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
