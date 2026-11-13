export type ShippingQuoteInput = Readonly<{
  subtotalVnd: number;
  address: string;
}>;

/**
 * DELIVN SHIPPING CALCULATION SERVICE
 *
 * COMMERCIAL POLICY (Owner Approved November 2026):
 * - Delivery is fulfilled via third-party logistics providers (e.g. GHN, J&T Express).
 * - Delivery provider is not permanently fixed.
 * - Shipping fee is NOT blanket free (0 VND) and depends on actual destination, package weight, and carrier tariff.
 *
 * COMPLIANCE & INTEGRATION STATUS:
 * - AUDIT TAG: SHIPPING_RATE_INTEGRATION_REQUIRED
 * - AUDIT TAG: SHIPPING_PRODUCTION_SAFE = false
 *
 * Note: Returning 0 VND below is a development stub. Full commercial operation and
 * Bộ Công Thương filing submission require integrating carrier pricing tariffs
 * so that customers are charged actual shipping fees rather than default 0 VND.
 */
export function calculateShippingFeeVnd(input: ShippingQuoteInput): number {
  void input;
  return 0;
}
