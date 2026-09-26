import { z } from "zod";

import type { ApiErrorResponse, CheckoutInput, OrderDTO } from "@/contracts";

const orderDtoSchema = z
  .object({
    id: z.uuid(),
    orderNumber: z.string().trim().min(1),
    totalVnd: z.number().int().nonnegative().safe(),
    paymentMethod: z.enum(["cod", "bank_transfer"]),
    orderStatus: z.enum([
      "pending",
      "confirmed",
      "preparing",
      "shipping",
      "completed",
      "cancelled",
    ]),
    paymentStatus: z.enum(["unpaid", "pending", "paid", "failed", "refunded"]),
    createdAt: z.iso.datetime(),
  })
  .strict();

orderDtoSchema satisfies z.ZodType<OrderDTO>;

const apiErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.string().min(1),
        message: z.string(),
        details: z.unknown().optional(),
      })
      .strict(),
  })
  .strict();

apiErrorResponseSchema satisfies z.ZodType<ApiErrorResponse>;

export type CheckoutHttpResult =
  | { ok: true; order: OrderDTO }
  | { ok: false; kind: "api"; status: number; code: string }
  | {
      ok: false;
      kind: "uncertain";
      reason: "network" | "malformed_response";
    };

export async function postCheckout(
  input: CheckoutInput,
  fetcher: typeof fetch = fetch,
): Promise<CheckoutHttpResult> {
  let response: Response;
  try {
    response = await fetcher("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, kind: "uncertain", reason: "network" };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, kind: "uncertain", reason: "malformed_response" };
  }

  if (response.status === 201) {
    const parsed = orderDtoSchema.safeParse(body);
    return parsed.success
      ? { ok: true, order: parsed.data }
      : { ok: false, kind: "uncertain", reason: "malformed_response" };
  }

  const parsed = apiErrorResponseSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, kind: "uncertain", reason: "malformed_response" };
  }

  return {
    ok: false,
    kind: "api",
    status: response.status,
    code: parsed.data.error.code,
  };
}
