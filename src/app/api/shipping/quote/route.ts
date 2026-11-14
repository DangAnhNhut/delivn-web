import { NextResponse } from "next/server";
import {
  createDefaultShippingQuoteService,
  resolveActiveProvider,
  type ShippingQuoteRequest,
} from "@/server/services/shipping.service";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Partial<ShippingQuoteRequest>;
    const forceNull =
      process.env.NODE_ENV !== "production" &&
      process.env.DELIVN_ENABLE_DEMO_SEED === "true" &&
      request.headers.get("x-delivn-test-shipping") === "disabled";
    const service = createDefaultShippingQuoteService(resolveActiveProvider({ forceNull }));
    const result = await service.getQuote({
      subtotalVnd: Number(body.subtotalVnd) || 0,
      address: typeof body.address === "string" ? body.address : "",
      provinceCode: typeof body.provinceCode === "string" ? body.provinceCode : undefined,
      communeCode: typeof body.communeCode === "string" ? body.communeCode : undefined,
      addressDetail: typeof body.addressDetail === "string" ? body.addressDetail : undefined,
      weightGrams: Number(body.weightGrams) || 500,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        status: "ERROR",
        message: error instanceof Error ? error.message : "Không thể tính phí vận chuyển.",
      },
      { status: 500 },
    );
  }
}
