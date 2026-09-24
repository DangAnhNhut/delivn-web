export const CART_STORAGE_KEY = "delivn.cart.v1";
export const CART_STORAGE_VERSION = 1 as const;
export const MAX_SNAPSHOT_PRICE_VND = 2_147_483_647;

export type CartImageSnapshot = {
  url: string;
  alt: string;
};

export type CartItem = {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantLabel: string;
  image: CartImageSnapshot | null;
  unitPriceVndSnapshot: number;
  quantity: number;
};

export type CartItemSnapshot = Omit<CartItem, "quantity">;

export type CartStorageV1 = {
  version: typeof CART_STORAGE_VERSION;
  items: CartItem[];
};
