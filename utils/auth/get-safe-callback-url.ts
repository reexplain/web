import { AUTH_DEFAULT_REDIRECT } from "@/constants/auth";

export const getSafeCallbackURL = (redirectTarget: string | null) => {
  if (!redirectTarget) return AUTH_DEFAULT_REDIRECT;
  if (!redirectTarget.startsWith("/") || redirectTarget.startsWith("//")) {
    return AUTH_DEFAULT_REDIRECT;
  }

  try {
    const callbackURL = new URL(redirectTarget, "http://reexplain.local");

    if (callbackURL.origin !== "http://reexplain.local") return AUTH_DEFAULT_REDIRECT;

    return `${callbackURL.pathname}${callbackURL.search}${callbackURL.hash}`;
  } catch {
    return AUTH_DEFAULT_REDIRECT;
  }
};
