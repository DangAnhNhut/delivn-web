import { describe, expect, it } from "vitest";

import { calculateShippingFeeVnd } from "./shipping.service";

describe("development shipping policy", () => {
  it("returns the temporary server-side 0 VND fee", () => {
    expect(calculateShippingFeeVnd({ subtotalVnd: 470_000, address: "Test address" })).toBe(0);
  });
});
