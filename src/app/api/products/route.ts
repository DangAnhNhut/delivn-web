import { unexpectedErrorResponse } from "@/server/http/api-errors";
import { createProductService } from "@/server/services/product.service";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const products = await createProductService().listActiveProducts();
    return Response.json(products);
  } catch (error) {
    return unexpectedErrorResponse(error);
  }
}
