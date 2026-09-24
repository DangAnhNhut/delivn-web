import { MAX_QUANTITY_PER_VARIANT, type CheckoutInput } from "@/contracts";
import { CheckoutValidationError } from "@/server/errors/commerce-error";

export type NormalizedCheckoutInput = Omit<CheckoutInput, "items"> & {
  items: ReadonlyArray<{ variantId: string; quantity: number }>;
};

export function normalizeCheckoutInput(input: CheckoutInput): NormalizedCheckoutInput {
  const quantities = new Map<string, number>();
  for (const item of input.items) {
    const quantity = (quantities.get(item.variantId) ?? 0) + item.quantity;
    if (quantity > MAX_QUANTITY_PER_VARIANT) {
      throw new CheckoutValidationError(
        `Quantity for variant ${item.variantId} exceeds ${MAX_QUANTITY_PER_VARIANT}.`,
        { path: ["items"], variantId: item.variantId },
      );
    }
    quantities.set(item.variantId, quantity);
  }

  const items = [...quantities.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([variantId, quantity]) => ({ variantId, quantity }));

  return { customer: input.customer, paymentMethod: input.paymentMethod, items };
}
