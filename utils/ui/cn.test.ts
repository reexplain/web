import { cn } from "@/utils/ui/cn";

describe("cn", () => {
  it("merges conflicting Tailwind classes", () => {
    expect(cn("px-2", "px-4", false && "hidden")).toBe("px-4");
  });
});
