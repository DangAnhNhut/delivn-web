import { errorResponse, unexpectedErrorResponse } from "@/server/http/api-errors";
import { createProductService } from "@/server/services/product.service";
import { productSlugSchema } from "@/server/validation/product.schema";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const parsedSlug = productSlugSchema.safeParse((await params).slug);
  if (!parsedSlug.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid product slug.");
  }

  try {
    const product = await createProductService().getActiveProductBySlug(parsedSlug.data);
    if (!product) {
      return errorResponse(404, "PRODUCT_NOT_FOUND", "Product not found.");
    }
    return Response.json(product);
  } catch (error) {
    return unexpectedErrorResponse(error);
  }
}
