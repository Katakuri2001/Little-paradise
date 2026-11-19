import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser, createSession } from "@/lib/server/store";
import { setSessionCookie } from "@/lib/server/auth-helper";
import { registerSchema } from "@/lib/schemas";
import { jsonError, zodError } from "@/lib/server/api";
import { checkRateLimit, rateLimitKey } from "@/lib/server/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const rl = await checkRateLimit(rateLimitKey("register", ip), 5, 60_000);
    if (!rl.allowed) return jsonError("RATE_LIMITED", "Too many requests", 429);

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const { email, password, username } = parsed.data;
    const u = await createUser(String(email).toLowerCase(), String(password), username);
    if (!u) return jsonError("CONFLICT", "Email already registered", 409);
    const token = await createSession(u.id);
    await setSessionCookie(token);
    return NextResponse.json({ user: { id: u.id, email: u.email, username: u.username, displayName: u.displayName, avatarSeed: u.avatarSeed, createdAt: u.createdAt } });
  } catch (e: any) {
    return jsonError("SERVER_ERROR", e?.message ?? "Server error", 500);
  }
}
