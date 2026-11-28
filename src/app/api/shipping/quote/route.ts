import { NextResponse } from "next/server";
import {
  createDefaultShippingQuoteService,
  resolveActiveProvider,
  type ShippingQuoteRequest,
} from "@/server/services/shipping.service";

export const runtime = "nodejs";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export async function POST(request: Request): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        status: "ERROR",
        code: "INVALID_JSON",
        message: "Dữ liệu JSON không hợp lệ.",
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (typeof rawBody !== "object" || rawBody === null || Array.isArray(rawBody)) {
    return NextResponse.json(
      {
        status: "ERROR",
        code: "VALIDATION_ERROR",
        message: "Dữ liệu yêu cầu tính phí vận chuyển không hợp lệ.",
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const body = rawBody as Partial<ShippingQuoteRequest>;
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
    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  } catch {
    return NextResponse.json(
      {
        status: "ERROR",
        message: "Không thể tính phí vận chuyển.",
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
