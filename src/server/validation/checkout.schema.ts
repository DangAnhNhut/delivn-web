import { z } from "zod";

export const MAX_CHECKOUT_ITEMS = 50;
export const MAX_QUANTITY_PER_VARIANT = 20;

const optionalEmailSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(254).email().transform((value) => value.toLowerCase()).optional(),
);

const optionalNoteSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(1_000).optional(),
);

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s().-]+$/)
  .transform((value) => value.replace(/[\s().-]/g, ""))
  .refine((value) => /^\+?\d{8,16}$/.test(value), "Phone must contain 8 to 16 digits.");

export const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    phone: phoneSchema,
    email: optionalEmailSchema,
    address: z.string().trim().min(5).max(500),
    note: optionalNoteSchema,
  }),
  paymentMethod: z.enum(["cod", "bank_transfer"]),
  items: z
    .array(
      z.object({
        variantId: z.uuid(),
        quantity: z.number().int().positive().max(MAX_QUANTITY_PER_VARIANT),
      }),
    )
    .min(1)
    .max(MAX_CHECKOUT_ITEMS),
});
