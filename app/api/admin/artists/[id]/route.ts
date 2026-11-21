import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getDBWithDemoData } from "@/lib/server/db";
import { auditLog } from "@/lib/server/audit-log";
import { checkRateLimit, rateLimitKey } from "@/lib/server/rate-limit";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await checkRateLimit(rateLimitKey("admin:update-artist", ip), 30, 60_000);
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
  const { name, biography } = body as { name?: string; biography?: string };

  const db = await getDBWithDemoData();
  if (!db) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "Database unavailable" } },
      { status: 503 },
    );
  }

  await db
    .prepare("UPDATE artists SET name = COALESCE(?, name), biography = COALESCE(?, biography) WHERE id = ?")
    .bind(name, biography, (await params).id)
    .run();

  await auditLog(db, {
    userId: u.id,
    action: "update_artist",
    targetType: "artist",
    targetId: (await params).id,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await checkRateLimit(rateLimitKey("admin:delete-artist", ip), 20, 60_000);
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

  const db = await getDBWithDemoData();
  if (!db) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "Database unavailable" } },
      { status: 503 },
    );
  }

  await db.prepare("DELETE FROM artists WHERE id = ?").bind((await params).id).run();

  await auditLog(db, {
    userId: u.id,
    action: "delete_artist",
    targetType: "artist",
    targetId: (await params).id,
  });

  return NextResponse.json({ success: true });
}
