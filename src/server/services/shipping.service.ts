export type ShippingQuoteInput = Readonly<{
  subtotalVnd: number;
  address: string;
}>;

/** TEMPORARY V1 DEVELOPMENT POLICY: production shipping pricing is not yet defined. */
export function calculateShippingFeeVnd(input: ShippingQuoteInput): number {
  void input;
  return 0;
}
