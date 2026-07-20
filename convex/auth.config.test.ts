describe("Convex auth config", () => {
  const originalSiteUrl = process.env.SITE_URL;
  const originalJwks = process.env.BETTER_AUTH_JWKS;

  afterAll(() => {
    process.env.SITE_URL = originalSiteUrl;
    process.env.BETTER_AUTH_JWKS = originalJwks;
  });

  it("uses an inline JWKS without changing the local token issuer", async () => {
    process.env.SITE_URL = "http://localhost:3000";
    process.env.BETTER_AUTH_JWKS =
      "data:application/json;base64,eyJrZXlzIjpbXX0=";

    const { default: authConfig } = await import("./auth.config");

    expect(authConfig.providers).toEqual([
      {
        type: "customJwt",
        applicationID: "http://localhost:3000",
        issuer: "http://localhost:3000",
        jwks: "data:application/json;base64,eyJrZXlzIjpbXX0=",
        algorithm: "ES256",
      },
    ]);
  });
});