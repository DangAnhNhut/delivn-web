import { describe, expect, it } from "vitest";

import { formatOrderNumber } from "./order-number";

describe("formatOrderNumber", () => {
  it("uses the UTC date and pads a global sequence", () => {
    expect(formatOrderNumber(new Date("2026-09-23T23:59:59.000Z"), "41")).toBe(
      "DLV-20260923-000041",
    );
    expect(formatOrderNumber(new Date("2026-09-24T00:00:00.000Z"), "42")).toBe(
      "DLV-20260924-000042",
    );
  });

  it("does not truncate sequence values longer than six digits", () => {
    expect(formatOrderNumber(new Date("2026-09-24T00:00:00.000Z"), "1234567")).toBe(
      "DLV-20260924-1234567",
    );
  });
});
