import { createCheckoutService } from "@/server/services/checkout.service";
import { NullShippingQuoteProvider } from "@/server/services/shipping.service";
import {
  authenticationRequiredResponse,
  invalidJsonResponse,
  unexpectedErrorResponse,
  validationErrorResponse,
} from "@/server/http/api-errors";
import { getSessionFromHeaders } from "@/server/auth/session";
import { normalizeCheckoutInput } from "@/server/validation/checkout-normalization";
import { checkoutSchema } from "@/server/validation/checkout.schema";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let session;
  try {
    session = await getSessionFromHeaders(request.headers);
  } catch (error) {
    return unexpectedErrorResponse(error);
  }
  if (!session) return authenticationRequiredResponse();

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
    const forceNull =
      process.env.NODE_ENV !== "production" &&
      process.env.DELIVN_ENABLE_DEMO_SEED === "true" &&
      request.headers.get("x-delivn-test-shipping") === "disabled";
    const checkoutService = createCheckoutService(
      undefined,
      forceNull ? { shippingProvider: new NullShippingQuoteProvider() } : undefined,
    );
    const order = await checkoutService.createOrder(normalized, {
      userId: session.user.id,
    });
    return Response.json(order, { status: 201 });
  } catch (error) {
    return unexpectedErrorResponse(error);
  }
}
