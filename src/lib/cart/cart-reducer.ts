import { MAX_QUANTITY_PER_VARIANT } from "@/contracts";

import type { CartItem, CartItemSnapshot } from "./cart-types";

export type CartAction =
  | { type: "replace"; items: CartItem[] }
  | { type: "add"; item: CartItemSnapshot }
  | { type: "increment"; variantId: string }
  | { type: "decrement"; variantId: string }
  | { type: "remove"; variantId: string }
  | { type: "clear" };

function updateQuantity(
  state: CartItem[],
  variantId: string,
  update: (quantity: number) => number,
): CartItem[] {
  const index = state.findIndex((item) => item.variantId === variantId);
  if (index === -1) return state;

  const current = state[index]!;
  const quantity = update(current.quantity);
  if (quantity === current.quantity) return state;

  return state.map((item, itemIndex) =>
    itemIndex === index ? { ...item, quantity } : item,
  );
}

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "replace":
      return action.items;
    case "add": {
      const index = state.findIndex((item) => item.variantId === action.item.variantId);
      if (index === -1) return [...state, { ...action.item, quantity: 1 }];

      const current = state[index]!;
      const quantity = Math.min(current.quantity + 1, MAX_QUANTITY_PER_VARIANT);
      return state.map((item, itemIndex) =>
        itemIndex === index ? { ...action.item, quantity } : item,
      );
    }
    case "increment":
      return updateQuantity(state, action.variantId, (quantity) =>
        Math.min(quantity + 1, MAX_QUANTITY_PER_VARIANT),
      );
    case "decrement":
      return updateQuantity(state, action.variantId, (quantity) =>
        Math.max(quantity - 1, 1),
      );
    case "remove": {
      const items = state.filter((item) => item.variantId !== action.variantId);
      return items.length === state.length ? state : items;
    }
    case "clear":
      return state.length === 0 ? state : [];
  }
}
