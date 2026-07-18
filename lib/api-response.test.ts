/** @jest-environment node */

import { readApiResponse } from "./api-response";

describe("readApiResponse", () => {
  it("propagates a JSON API error message", async () => {
    const response = Response.json(
      { error: "The learning model is busy. Try again shortly." },
      { status: 429 },
    );

    await expect(readApiResponse(response, "Request failed.")).rejects.toThrow(
      "The learning model is busy. Try again shortly.",
    );
  });

  it("uses the fallback for a non-JSON error response", async () => {
    const response = new Response("Bad gateway", { status: 502 });

    await expect(readApiResponse(response, "Request failed.")).rejects.toThrow(
      "Request failed.",
    );
  });
});