import { AUTH_DEFAULT_REDIRECT } from "@/constants/auth";
import { getSafeCallbackURL } from "@/utils/auth/get-safe-callback-url";

describe("getSafeCallbackURL", () => {
  it("preserves a local path, query string, and hash", () => {
    expect(getSafeCallbackURL("/session?source=upload#step-2")).toBe(
      "/session?source=upload#step-2",
    );
  });

  it.each(["https://example.com", "//example.com", "dashboard", null])(
    "falls back for unsafe callback URLs (%s)",
    (callbackURL) => {
      expect(getSafeCallbackURL(callbackURL)).toBe(AUTH_DEFAULT_REDIRECT);
    },
  );
});
