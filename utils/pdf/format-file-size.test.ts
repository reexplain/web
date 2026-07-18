import { formatFileSize } from "@/utils/pdf/format-file-size";

describe("formatFileSize", () => {
  it("formats file sizes in megabytes with one decimal place", () => {
    expect(formatFileSize(1.25 * 1024 * 1024)).toBe("1.3 MB");
  });
});
