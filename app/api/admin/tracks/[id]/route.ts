import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getDBWithDemoData } from "@/lib/server/db";
import { auditLog } from "@/lib/server/audit-log";
import { checkRateLimit, rateLimitKey } from "@/lib/server/rate-limit";
import { z } from "zod";

const updateTrackSchema = z.object({
  title: z.string().min(1).optional(),
  artist_id: z.string().optional(),
  album_id: z.string().optional(),
  duration: z.number().nonnegative().optional(),
  genre: z.string().optional(),
  audio_source_reference: z.string().optional(),
  artwork_url: z.string().optional(),
  track_number: z.number().int().nonnegative().optional(),
  is_available: z.boolean().optional(),
  status: z.enum(["published", "unpublished"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const KV = (globalThis as any).KV;
  const rl = await checkRateLimit(rateLimitKey("admin:update-track", ip), 30, 60_000, KV);
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
  const parsed = updateTrackSchema.safeParse(body);
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

  const { id } = await params;
  const {
    title,
    artist_id,
    album_id,
    duration,
    genre,
    audio_source_reference,
    artwork_url,
    track_number,
    is_available,
    status,
  } = parsed.data;

  await db
    .prepare(
      "UPDATE tracks SET title = COALESCE(?, title), artist_id = COALESCE(?, artist_id), album_id = COALESCE(?, album_id), duration = COALESCE(?, duration), genre = COALESCE(?, genre), audio_source_reference = COALESCE(?, audio_source_reference), artwork_url = COALESCE(?, artwork_url), track_number = COALESCE(?, track_number), is_available = COALESCE(?, is_available), status = COALESCE(?, status), updated_at = datetime('now') WHERE id = ?",
    )
    .bind(
      title,
      artist_id,
      album_id,
      duration,
      genre,
      audio_source_reference,
      artwork_url,
      track_number,
      is_available,
      status,
      id,
    )
    .run();

  await auditLog(db, {
    userId: u.id,
    action: status === "unpublished" ? "unpublish_track" : status === "published" ? "publish_track" : "update_track",
    targetType: "track",
    targetId: id,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const KV = (globalThis as any).KV;
  const rl = await checkRateLimit(rateLimitKey("admin:delete-track", ip), 20, 60_000, KV);
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

  const { id } = await params;
  await db.prepare("DELETE FROM tracks WHERE id = ?").bind(id).run();

  await auditLog(db, {
    userId: u.id,
    action: "delete_track",
    targetType: "track",
    targetId: id,
  });

  return NextResponse.json({ success: true });
}
