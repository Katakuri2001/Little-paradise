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
  const KV = (globalThis as any).KV;
  const rl = await checkRateLimit(rateLimitKey("admin:update-playlist", ip), 30, 60_000, KV);
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
  const { name, description, isPublic } = body as { name?: string; description?: string; isPublic?: boolean };

  const db = await getDBWithDemoData();
  if (!db) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "Database unavailable" } },
      { status: 503 },
    );
  }

  await db
    .prepare("UPDATE playlists SET name = COALESCE(?, name), description = COALESCE(?, description), is_public = COALESCE(?, is_public) WHERE id = ?")
    .bind(name, description, isPublic === undefined ? null : isPublic ? 1 : 0, (await params).id)
    .run();

  await auditLog(db, {
    userId: u.id,
    action: isPublic === undefined ? "update_playlist" : isPublic ? "feature_playlist" : "unfeature_playlist",
    targetType: "playlist",
    targetId: (await params).id,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const KV = (globalThis as any).KV;
  const rl = await checkRateLimit(rateLimitKey("admin:delete-playlist", ip), 20, 60_000, KV);
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

  await db.prepare("DELETE FROM playlists WHERE id = ?").bind((await params).id).run();

  await auditLog(db, {
    userId: u.id,
    action: "delete_playlist",
    targetType: "playlist",
    targetId: (await params).id,
  });

  return NextResponse.json({ success: true });
}
