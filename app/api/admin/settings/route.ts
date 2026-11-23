import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getDBWithDemoData } from "@/lib/server/db";
import { auditLog } from "@/lib/server/audit-log";
import { checkRateLimit, rateLimitKey } from "@/lib/server/rate-limit";
import { z } from "zod";

const settingsSchema = z.record(z.string(), z.any());

export async function GET() {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") {
    return NextResponse.json(
      { error: { code: u ? "FORBIDDEN" : "UNAUTHORIZED", message: u ? "Forbidden" : "Unauthorized" } },
      { status: u ? 403 : 401 },
    );
  }

  const db = await getDBWithDemoData();
  if (!db) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "Database unavailable" } },
      { status: 503 },
    );
  }

  const rows = await db.prepare("SELECT key, value FROM app_settings").all();
  const settings: Record<string, string> = {};
  for (const row of rows.results || []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const KV = (globalThis as any).KV;
  const rl = await checkRateLimit(rateLimitKey("admin:update-settings", ip), 30, 60_000, KV);
  if (!rl.allowed) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many requests" } }, { status: 429 });
  }
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") {
    return NextResponse.json(
      { error: { code: u ? "FORBIDDEN" : "UNAUTHORIZED", message: u ? "Forbidden" : "Unauthorized" } },
      { status: u ? 403 : 401 },
    );
  }

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request body" } },
      { status: 400 },
    );
  }

  const db = await getDBWithDemoData();
  if (!db) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "Database unavailable" } },
      { status: 503 },
    );
  }

  const updates = parsed.data;
  for (const [key, value] of Object.entries(updates)) {
    await db
      .prepare(
        "INSERT INTO app_settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = datetime('now')",
      )
      .bind(key, JSON.stringify(value), u.id)
      .run();

    await auditLog(db, {
      userId: u.id,
      action: "update_setting",
      targetType: "setting",
      targetId: key,
    });
  }

  return NextResponse.json({ success: true, settings: updates });
}
