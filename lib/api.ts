import { NextResponse } from "next/server";

export function jsonError(message: string, status = 500, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      ...(details ? { details } : {})
    },
    { status }
  );
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}

export function logApiError(scope: string, error: unknown) {
  console.error("[" + scope + "]", error);
}
