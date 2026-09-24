import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  InsufficientInventoryError,
  ItemUnavailableError,
  MoneyLimitError,
  ServerConfigurationError,
} from "@/server/errors/commerce-error";

import {
  invalidJsonResponse,
  unexpectedErrorResponse,
  validationErrorResponse,
} from "./api-errors";

async function body(response: Response) {
  return response.json() as Promise<{ error: { code: string; message: string; details?: unknown } }>;
}

describe("API error responses", () => {
  it("returns a stable malformed JSON error", async () => {
    const response = invalidJsonResponse();
    expect(response.status).toBe(400);
    await expect(body(response)).resolves.toMatchObject({ error: { code: "INVALID_JSON" } });
  });

  it("returns safe Zod field paths", async () => {
    const parsed = z.object({ quantity: z.number().positive() }).safeParse({ quantity: 0 });
    if (parsed.success) throw new Error("Fixture must fail");
    const response = validationErrorResponse(parsed.error);
    expect(response.status).toBe(400);
    await expect(body(response)).resolves.toMatchObject({
      error: { code: "VALIDATION_ERROR", details: [{ path: ["quantity"] }] },
    });
  });

  it.each([
    [new ItemUnavailableError(), 409, "ITEM_UNAVAILABLE"],
    [new InsufficientInventoryError(), 409, "INSUFFICIENT_INVENTORY"],
    [new MoneyLimitError(), 422, "ORDER_VALUE_LIMIT_EXCEEDED"],
    [new ServerConfigurationError(), 500, "SERVER_CONFIGURATION_ERROR"],
  ])("maps domain errors without internal details", async (error, status, code) => {
    const response = unexpectedErrorResponse(error);
    expect(response.status).toBe(status);
    await expect(body(response)).resolves.toMatchObject({ error: { code } });
  });

  it("does not leak unknown error messages", async () => {
    const response = unexpectedErrorResponse(
      new Error("postgresql://user:secret@localhost:5432/db constraint_name"),
    );
    expect(response.status).toBe(500);
    const result = await body(response);
    expect(result).toEqual({
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
    });
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.stringify(result)).not.toContain("constraint_name");
  });
});
