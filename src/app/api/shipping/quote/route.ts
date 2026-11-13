import { NextResponse } from "next/server";
import {
  createDefaultShippingQuoteService,
  type ShippingQuoteRequest,
} from "@/server/services/shipping.service";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Partial<ShippingQuoteRequest>;
    const service = createDefaultShippingQuoteService();
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
