import type { AuthConfig } from "convex/server";

const siteUrl = process.env.SITE_URL;
const jwks = process.env.BETTER_AUTH_JWKS;

if (!siteUrl) {
  throw new Error("SITE_URL is not configured.");
}

if (!jwks) {
  throw new Error(
    "BETTER_AUTH_JWKS is not configured. Run `npm run auth:sync-convex-jwks`.",
  );
}

export default {
  providers: [
    {
      type: "customJwt",
      applicationID: siteUrl,
      issuer: siteUrl,
      jwks,
      algorithm: "ES256",
    },
  ],
} satisfies AuthConfig;