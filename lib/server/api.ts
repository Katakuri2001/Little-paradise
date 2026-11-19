import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function zodError(err: ZodError) {
  const msg = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  return jsonError("VALIDATION_ERROR", msg, 400);
}

export async function withErrorHandling<T>(fn: () => Promise<T>): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (e: unknown) {
    if (e instanceof ZodError) return zodError(e);
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonError("SERVER_ERROR", msg, 500);
  }
}