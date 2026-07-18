import type { AuthConfig } from "convex/server";

const siteUrl = process.env.SITE_URL;

if (!siteUrl) {
  throw new Error("SITE_URL is not configured.");
}

export default {
  providers: [
    {
      type: "customJwt",
      applicationID: siteUrl,
      issuer: siteUrl,
      jwks: `${siteUrl}/api/auth/jwks`,
      algorithm: "ES256",
    },
  ],
} satisfies AuthConfig;