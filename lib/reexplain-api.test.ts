/** @jest-environment node */

import { callReExplainApi, ReExplainApiError } from "./reexplain-api";

const isResult = (value: unknown): value is { ok: true } =>
  Boolean(value && typeof value === "object" && "ok" in value && value.ok === true);

describe("callReExplainApi", () => {
  const originalServiceKey = process.env.REEXPLAIN_API_SERVICE_KEY;

  beforeEach(() => {
    process.env.REEXPLAIN_API_SERVICE_KEY = "test-service-key";
  });

  afterAll(() => {
    process.env.REEXPLAIN_API_SERVICE_KEY = originalServiceKey;
  });

  it("preserves a backend string error and status", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce(
      Response.json({ detail: "PDF files must contain 25 pages or fewer." }, { status: 422 }),
    );

    await expect(
      callReExplainApi("/api/v1/pdf/extract", { method: "POST" }, isResult),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ReExplainApiError>>({
        message: "PDF files must contain 25 pages or fewer.",
        status: 422,
      }),
    );
  });

  it("formats FastAPI validation errors", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce(
      Response.json(
        { detail: [{ loc: ["body", "file"], msg: "Field required", type: "missing" }] },
        { status: 422 },
      ),
    );

    await expect(
      callReExplainApi("/api/v1/pdf/extract", { method: "POST" }, isResult),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ReExplainApiError>>({
        message: "file: Field required",
        status: 422,
      }),
    );
  });

  it("turns network failures into a typed service error", async () => {
    jest.spyOn(global, "fetch").mockRejectedValueOnce(new TypeError("fetch failed"));

    await expect(
      callReExplainApi("/api/v1/health", { method: "GET" }, isResult),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ReExplainApiError>>({
        message: "The document service could not be reached.",
        status: 503,
      }),
    );
  });
});