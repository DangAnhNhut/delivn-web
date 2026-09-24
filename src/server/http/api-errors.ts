import type { ApiErrorResponse } from "@/contracts";
import { CommerceError } from "@/server/errors/commerce-error";
import type { ZodError } from "zod";

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  const body: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  };
  return Response.json(body, { status });
}

export function unexpectedErrorResponse(error: unknown): Response {
  if (error instanceof CommerceError) {
    return errorResponse(error.status, error.code, error.message, error.details);
  }
  return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred.");
}

export function invalidJsonResponse(): Response {
  return errorResponse(400, "INVALID_JSON", "Request body must be valid JSON.");
}

export function validationErrorResponse(error: ZodError): Response {
  const details = error.issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
  }));
  return errorResponse(400, "VALIDATION_ERROR", "Request validation failed.", details);
}
