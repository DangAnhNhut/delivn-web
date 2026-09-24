import { z } from "zod";

import { MAX_QUANTITY_PER_VARIANT } from "@/contracts";

import {
  CART_STORAGE_VERSION,
  MAX_SNAPSHOT_PRICE_VND,
} from "./cart-types";

const nonEmptyText = z.string().trim().min(1);

const cartImageSnapshotSchema = z
  .object({
    url: nonEmptyText,
    alt: nonEmptyText,
  })
  .strict();

export const cartItemSchema = z
  .object({
    productId: z.uuid(),
    productSlug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    productName: nonEmptyText,
    variantId: z.uuid(),
    variantLabel: nonEmptyText,
    image: cartImageSnapshotSchema.nullable(),
    unitPriceVndSnapshot: z.number().int().min(0).max(MAX_SNAPSHOT_PRICE_VND),
    quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_VARIANT),
  })
  .strict();

export const cartStorageV1Schema = z
  .object({
    version: z.literal(CART_STORAGE_VERSION),
    items: z.array(cartItemSchema),
  })
  .strict()
  .superRefine((payload, context) => {
    const seenVariantIds = new Set<string>();

    payload.items.forEach((item, index) => {
      if (seenVariantIds.has(item.variantId)) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "variantId"],
          message: "Cart variant IDs must be unique.",
        });
      }
      seenVariantIds.add(item.variantId);
    });
  });
