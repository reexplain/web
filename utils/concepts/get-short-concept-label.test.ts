import { getShortConceptLabel } from "@/utils/concepts/get-short-concept-label";

describe("getShortConceptLabel", () => {
  it("keeps concise concept names unchanged", () => {
    expect(getShortConceptLabel("Heat transfer")).toBe("Heat transfer");
  });

  it("shortens legacy sentence-like concept names", () => {
    expect(getShortConceptLabel("Physics uses observations models and mathematics to predict behavior"))
      .toBe("Physics uses observations models and…");
  });

  it("limits long labels even when they contain few words", () => {
    expect(getShortConceptLabel("Electromagnetismandsuperconductivityrelationships"))
      .toBe("Electromagnetismandsuperconductivityrelat…");
  });
});
