import { NextResponse } from "next/server";
import { verifyUser, createSession, deleteSession } from "@/lib/server/store";
import { cookies } from "next/headers";
import { setSessionCookie } from "@/lib/server/auth-helper";
import { loginSchema } from "@/lib/schemas";
import { jsonError, zodError } from "@/lib/server/api";
import { checkRateLimit, rateLimitKey } from "@/lib/server/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const rl = await checkRateLimit(rateLimitKey("login", ip), 10, 60_000);
    if (!rl.allowed) return jsonError("RATE_LIMITED", "Too many requests", 429);

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const { email, password } = parsed.data;
    const u = await verifyUser(String(email).toLowerCase(), String(password));
    if (!u) return jsonError("UNAUTHORIZED", "Invalid credentials", 401);
    // rotate session
    const cookieStore = await cookies();
    const old = cookieStore.get("lp_session")?.value;
    if (old) await deleteSession(old);
    const token = await createSession(u.id);
    await setSessionCookie(token);
    return NextResponse.json({ user: { id: u.id, email: u.email, username: u.username, displayName: u.displayName, avatarSeed: u.avatarSeed, createdAt: u.createdAt } });
  } catch (e: any) {
    return jsonError("SERVER_ERROR", e?.message ?? "Server error", 500);
  }
}
