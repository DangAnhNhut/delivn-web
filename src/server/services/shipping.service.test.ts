import { describe, expect, it } from "vitest";

import {
  createDefaultShippingQuoteService,
  FakeTestShippingQuoteProvider,
  NullShippingQuoteProvider,
  ShippingQuoteService,
  type ShippingQuoteRequest,
} from "./shipping.service";

const sampleRequest: ShippingQuoteRequest = {
  subtotalVnd: 470_000,
  address: "123 Đường Cà Phê, Phường Thới Hòa, Thành phố Hồ Chí Minh, Việt Nam",
  provinceCode: "79",
  communeCode: "26740",
  weightGrams: 500,
};

describe("ShippingQuote architecture & safety", () => {
  it("NullShippingQuoteProvider rejects quotes when no carrier is configured", async () => {
    const provider = new NullShippingQuoteProvider();
    const result = await provider.quote(sampleRequest);

    expect(result.status).toBe("UNAVAILABLE");
    if (result.status !== "UNAVAILABLE") throw new Error("Expected UNAVAILABLE");
    expect(result.reason).toContain("Phí vận chuyển cần được xác định");
    expect(result.reason).not.toContain("0 đ");
    expect(result.reason).not.toContain("Miễn phí");
  });

  it("FakeTestShippingQuoteProvider produces deterministic valid quotes with positive amount", async () => {
    const provider = new FakeTestShippingQuoteProvider(35_000);
    const result = await provider.quote(sampleRequest);

    expect(result.status).toBe("QUOTED");
    if (result.status !== "QUOTED") throw new Error("Expected QUOTED");
    expect(result.quote.amountVnd).toBe(35_000);
    expect(result.quote.amountVnd).toBeGreaterThan(0);
    expect(result.quote.providerId).toBe("fake-test-carrier");
    expect(result.quote.destination.address).toBe(sampleRequest.address);
    expect(result.quote.weightGrams).toBe(500);
  });

  it("FakeTestShippingQuoteProvider prevents non-positive amounts", () => {
    expect(() => new FakeTestShippingQuoteProvider(0)).toThrow(/strictly positive/);
    expect(() => new FakeTestShippingQuoteProvider(-10_000)).toThrow(/strictly positive/);
  });

  it("FakeTestShippingQuoteProvider is strictly forbidden in production", () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      // @ts-expect-error mutating for test
      process.env.NODE_ENV = "production";
      expect(() => new FakeTestShippingQuoteProvider(30_000)).toThrow(/strictly forbidden in production/);
    } finally {
      // @ts-expect-error restoring
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("ShippingQuoteService validates request completeness", async () => {
    const service = new ShippingQuoteService(new FakeTestShippingQuoteProvider(30_000));

    const emptyAddress = await service.getQuote({ ...sampleRequest, address: "   " });
    expect(emptyAddress.status).toBe("UNAVAILABLE");

    const zeroSubtotal = await service.getQuote({ ...sampleRequest, subtotalVnd: 0 });
    expect(zeroSubtotal.status).toBe("UNAVAILABLE");
  });

  it("createDefaultShippingQuoteService returns Null provider when no carrier env is set", async () => {
    const service = createDefaultShippingQuoteService();
    const result = await service.getQuote(sampleRequest);

    expect(result.status).toBe("UNAVAILABLE");
  });
});
