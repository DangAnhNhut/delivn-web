import { createCheckoutService } from "@/server/services/checkout.service";
import {
  invalidJsonResponse,
  unexpectedErrorResponse,
  validationErrorResponse,
} from "@/server/http/api-errors";
import { normalizeCheckoutInput } from "@/server/validation/checkout-normalization";
import { checkoutSchema } from "@/server/validation/checkout.schema";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return invalidJsonResponse();
  }

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const normalized = normalizeCheckoutInput(parsed.data);
    const order = await createCheckoutService().createOrder(normalized);
    return Response.json(order, { status: 201 });
  } catch (error) {
    return unexpectedErrorResponse(error);
  }
}
