"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

import type { CheckoutInput } from "@/contracts";
import { cartReducer } from "@/lib/cart/cart-reducer";
import { selectCartItemCount } from "@/lib/cart/cart-selectors";
import {
  createEmptyCartStorage,
  parseCartStorage,
  readCartStorage,
  serializeCart,
  writeCartStorage,
} from "@/lib/cart/cart-storage";
import type { CartItem, CartItemSnapshot } from "@/lib/cart/cart-types";
import { CART_STORAGE_KEY } from "@/lib/cart/cart-types";

type CartContextValue = {
  items: readonly CartItem[];
  itemCount: number;
  isHydrated: boolean;
  addItem: (item: CartItemSnapshot) => boolean;
  increment: (variantId: string) => void;
  decrement: (variantId: string) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  reconcileSubmittedItems: (
    items: ReadonlyArray<CheckoutInput["items"][number]>,
  ) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function getBrowserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [isHydrated, markHydrated] = useReducer(() => true, false);
  const isHydratedRef = useRef(false);
  const lastSerializedRef = useRef<string | null>(null);

  useEffect(() => {
    const storage = getBrowserStorage();
    const stored = storage
      ? readCartStorage(storage)
      : {
          payload: createEmptyCartStorage(),
          serialized: serializeCart([]),
        };
    lastSerializedRef.current = stored.serialized;
    dispatch({ type: "replace", items: stored.payload.items });
    isHydratedRef.current = true;
    markHydrated();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const serialized = serializeCart(items);
    if (serialized === lastSerializedRef.current) return;

    const storage = getBrowserStorage();
    if (storage && writeCartStorage(storage, serialized)) {
      lastSerializedRef.current = serialized;
    }
  }, [isHydrated, items]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY) return;
      const storage = getBrowserStorage();
      if (event.storageArea !== null && event.storageArea !== storage) return;

      if (event.newValue === null) {
        const serialized = serializeCart([]);
        lastSerializedRef.current = serialized;
        dispatch({ type: "replace", items: [] });
        return;
      }

      const parsed = parseCartStorage(event.newValue);
      if (!parsed.ok) return;

      lastSerializedRef.current = parsed.serialized;
      dispatch({ type: "replace", items: parsed.payload.items });
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const addItem = useCallback((item: CartItemSnapshot) => {
    if (!isHydratedRef.current) return false;
    dispatch({ type: "add", item });
    return true;
  }, []);

  const increment = useCallback((variantId: string) => {
    if (!isHydratedRef.current) return;
    dispatch({ type: "increment", variantId });
  }, []);

  const decrement = useCallback((variantId: string) => {
    if (!isHydratedRef.current) return;
    dispatch({ type: "decrement", variantId });
  }, []);

  const removeItem = useCallback((variantId: string) => {
    if (!isHydratedRef.current) return;
    dispatch({ type: "remove", variantId });
  }, []);

  const clearCart = useCallback(() => {
    if (!isHydratedRef.current) return;
    dispatch({ type: "clear" });
  }, []);

  const reconcileSubmittedItems = useCallback(
    (submittedItems: ReadonlyArray<CheckoutInput["items"][number]>) => {
      if (!isHydratedRef.current) return;
      dispatch({ type: "reconcileSubmitted", items: submittedItems });
    },
    [],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: selectCartItemCount(items),
      isHydrated,
      addItem,
      increment,
      decrement,
      removeItem,
      clearCart,
      reconcileSubmittedItems,
    }),
    [
      addItem,
      clearCart,
      decrement,
      increment,
      isHydrated,
      items,
      reconcileSubmittedItems,
      removeItem,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used within CartProvider.");
  return cart;
}
