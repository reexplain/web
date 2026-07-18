const getErrorMessage = (body: unknown, fallback: string) => {
  if (!body || typeof body !== "object") return fallback;

  const candidate = body as { error?: unknown; detail?: unknown };
  if (typeof candidate.error === "string" && candidate.error.trim()) {
    return candidate.error;
  }
  if (typeof candidate.detail === "string" && candidate.detail.trim()) {
    return candidate.detail;
  }

  return fallback;
};

export async function readApiResponse(
  response: Response,
  fallbackError: string,
): Promise<unknown> {
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(body, fallbackError));
  }
  if (body === null) {
    throw new Error("The server returned an invalid response.");
  }

  return body;
}