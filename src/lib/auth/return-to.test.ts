import { describe, expect, it } from "vitest";
import { sanitizeReturnTo } from "./return-to";

describe("sanitizeReturnTo", () => {
  it.each(["/thanh-toan", "/tai-khoan/don-hang?tab=1#top"])("accepts %s", (value) => {
    expect(sanitizeReturnTo(value, "/")).toBe(value);
  });

  it.each([undefined, "", "https://evil.test", "//evil.test", "/\\evil", "/%5cevil", "/%0d%0aevil", "%", "user@example.test"])
    ("rejects unsafe value %s", (value) => {
      expect(sanitizeReturnTo(value, "/san-pham")).toBe("/san-pham");
    });

  it("uses root when the fallback is unsafe", () => {
    expect(sanitizeReturnTo("https://evil.test", "//evil.test")).toBe("/");
  });
});
