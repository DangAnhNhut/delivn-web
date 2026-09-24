import type { CartItem } from "./cart-types";

export function selectCartItemCount(items: readonly CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function selectCartLineTotalVnd(item: CartItem): bigint {
  return BigInt(item.unitPriceVndSnapshot) * BigInt(item.quantity);
}

export function selectCartSubtotalVnd(items: readonly CartItem[]): bigint {
  return items.reduce(
    (total, item) => total + selectCartLineTotalVnd(item),
    BigInt(0),
  );
}

export function selectCheckoutItems(items: readonly CartItem[]) {
  return items.map(({ variantId, quantity }) => ({ variantId, quantity }));
}
