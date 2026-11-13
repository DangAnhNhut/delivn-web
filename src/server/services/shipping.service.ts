/**
 * DELIVN CARRIER-AGNOSTIC SHIPPING QUOTE ARCHITECTURE
 *
 * COMMERCIAL & LEGAL REQUIREMENTS:
 * - Delivery is fulfilled via third-party logistics providers (GHN, J&T Express, etc.).
 * - Delivery provider is variable; shipping fee is variable based on carrier tariffs and address.
 * - Blanket free shipping is NOT approved.
 * - shippingFee = 0 must NEVER be interpreted as free shipping.
 * - Checkout CANNOT finalize an order when the shipping charge is unknown or unquoted.
 *
 * AUDIT STATUS:
 * - SHIPPING_RATE_INTEGRATION_REQUIRED = true
 * - SHIPPING_PRODUCTION_SAFE = false (until real carrier credentials and tariffs are configured)
 */

export type ShippingQuoteStatus =
  | "NOT_REQUESTED"
  | "LOADING"
  | "QUOTED"
  | "UNAVAILABLE"
  | "ERROR";

export type ShippingQuoteRequest = Readonly<{
  subtotalVnd: number;
  address: string;
  provinceCode?: string;
  communeCode?: string;
  addressDetail?: string;
  weightGrams?: number;
}>;

export type ShippingQuote = Readonly<{
  amountVnd: number;
  providerId: string;
  providerName: string;
  destination: Readonly<{
    address: string;
    provinceCode?: string;
    communeCode?: string;
  }>;
  weightGrams: number;
  orderValueVnd: number;
  quotedAt: string;
}>;

export type ShippingQuoteResult =
  | { status: "QUOTED"; quote: ShippingQuote }
  | { status: "UNAVAILABLE"; reason: string }
  | { status: "ERROR"; message: string };

export interface ShippingQuoteProvider {
  readonly id: string;
  readonly name: string;
  quote(request: ShippingQuoteRequest): Promise<ShippingQuoteResult> | ShippingQuoteResult;
}

/**
 * Default provider when real carrier credentials (GHN, J&T) are not yet configured.
 * Safely rejects quotes so checkout cannot complete with a 0 VND development stub.
 */
export class NullShippingQuoteProvider implements ShippingQuoteProvider {
  readonly id = "none";
  readonly name = "Chưa kết nối đơn vị vận chuyển";

  quote(request: ShippingQuoteRequest): ShippingQuoteResult {
    void request;
    return {
      status: "UNAVAILABLE",
      reason:
        "Phí vận chuyển cần được xác định theo địa chỉ nhận hàng và biểu phí thực tế của đơn vị vận chuyển trước khi hoàn tất đơn hàng.",
    };
  }
}

/**
 * Controlled test provider ONLY permitted in test / E2E environments.
 * Guarded against any use in production.
 */
export class FakeTestShippingQuoteProvider implements ShippingQuoteProvider {
  readonly id = "fake-test-carrier";
  readonly name = "Đơn vị vận chuyển thử nghiệm";

  constructor(private readonly fixedAmountVnd = 30_000) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL: FakeTestShippingQuoteProvider is strictly forbidden in production.",
      );
    }
    if (fixedAmountVnd <= 0) {
      throw new Error("Test shipping quote amount must be strictly positive (> 0 VND).");
    }
  }

  quote(request: ShippingQuoteRequest): ShippingQuoteResult {
    return {
      status: "QUOTED",
      quote: {
        amountVnd: this.fixedAmountVnd,
        providerId: this.id,
        providerName: this.name,
        destination: {
          address: request.address,
          provinceCode: request.provinceCode,
          communeCode: request.communeCode,
        },
        weightGrams: request.weightGrams ?? 500,
        orderValueVnd: request.subtotalVnd,
        quotedAt: new Date().toISOString(),
      },
    };
  }
}

export class ShippingQuoteService {
  constructor(private readonly provider: ShippingQuoteProvider = resolveActiveProvider()) {}

  async getQuote(request: ShippingQuoteRequest): Promise<ShippingQuoteResult> {
    if (!request.address || !request.address.trim()) {
      return {
        status: "UNAVAILABLE",
        reason: "Vui lòng cung cấp địa chỉ nhận hàng hợp lệ để tính phí vận chuyển.",
      };
    }
    if (request.subtotalVnd <= 0) {
      return {
        status: "UNAVAILABLE",
        reason: "Giá trị đơn hàng phải lớn hơn 0 VND.",
      };
    }
    return this.provider.quote(request);
  }
}

function resolveActiveProvider(): ShippingQuoteProvider {
  // If explicitly configured for test in non-production:
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.DELIVN_TEST_SHIPPING_RATE_VND
  ) {
    const rate = Number(process.env.DELIVN_TEST_SHIPPING_RATE_VND);
    return new FakeTestShippingQuoteProvider(Number.isFinite(rate) && rate > 0 ? rate : 30_000);
  }
  return new NullShippingQuoteProvider();
}

export function createDefaultShippingQuoteService(): ShippingQuoteService {
  return new ShippingQuoteService();
}
