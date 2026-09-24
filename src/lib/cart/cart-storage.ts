import { cartStorageV1Schema } from "./cart-schema";
import {
  CART_STORAGE_KEY,
  CART_STORAGE_VERSION,
  type CartItem,
  type CartStorageV1,
} from "./cart-types";

export type ParsedCartStorage =
  | { ok: true; payload: CartStorageV1; serialized: string }
  | { ok: false };

export function createEmptyCartStorage(): CartStorageV1 {
  return { version: CART_STORAGE_VERSION, items: [] };
}

export function serializeCart(items: readonly CartItem[]): string {
  return JSON.stringify({ version: CART_STORAGE_VERSION, items });
}

export function parseCartStorage(raw: string): ParsedCartStorage {
  try {
    const result = cartStorageV1Schema.safeParse(JSON.parse(raw));
    if (!result.success) return { ok: false };

    const payload: CartStorageV1 = result.data;
    return { ok: true, payload, serialized: serializeCart(payload.items) };
  } catch {
    return { ok: false };
  }
}

export function readCartStorage(storage: Storage): {
  payload: CartStorageV1;
  serialized: string;
} {
  const empty = createEmptyCartStorage();
  const emptyResult = { payload: empty, serialized: serializeCart(empty.items) };

  try {
    const raw = storage.getItem(CART_STORAGE_KEY);
    if (raw === null) return emptyResult;

    const parsed = parseCartStorage(raw);
    if (parsed.ok) {
      return { payload: parsed.payload, serialized: parsed.serialized };
    }

    try {
      storage.removeItem(CART_STORAGE_KEY);
    } catch {
      // An invalid cart still becomes empty when storage removal is blocked.
    }
    return emptyResult;
  } catch {
    return emptyResult;
  }
}

export function writeCartStorage(storage: Storage, serialized: string): boolean {
  try {
    storage.setItem(CART_STORAGE_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}
