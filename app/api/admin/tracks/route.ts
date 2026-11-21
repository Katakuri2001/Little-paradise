import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getDBWithDemoData } from "@/lib/server/db";
import { auditLog } from "@/lib/server/audit-log";
import { checkRateLimit, rateLimitKey } from "@/lib/server/rate-limit";
import { z } from "zod";

const createTrackSchema = z.object({
  title: z.string().min(1),
  artist_id: z.string().optional(),
  album_id: z.string().optional(),
  duration: z.number().nonnegative().optional(),
  genre: z.string().optional(),
  audio_source_type: z.string().optional().default("file"),
  audio_source_reference: z.string().optional(),
  artwork_url: z.string().optional(),
  track_number: z.number().int().nonnegative().optional(),
  is_available: z.boolean().optional().default(true),
  status: z.enum(["published", "unpublished"]).optional().default("published"),
});

export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  let rows;
  if (status) {
    rows = await db
      .prepare(
        "SELECT t.id, t.title, t.duration, t.genre, t.is_available, t.status, t.created_at, a.name AS artist, al.title AS album FROM tracks t LEFT JOIN artists a ON t.artist_id = a.id LEFT JOIN albums al ON t.album_id = al.id WHERE t.status = ? ORDER BY t.created_at DESC",
      )
      .bind(status)
      .all();
  } else {
    rows = await db
      .prepare(
        "SELECT t.id, t.title, t.duration, t.genre, t.is_available, t.status, t.created_at, a.name AS artist, al.title AS album FROM tracks t LEFT JOIN artists a ON t.artist_id = a.id LEFT JOIN albums al ON t.album_id = al.id ORDER BY t.created_at DESC",
      )
      .all();
  }

  return NextResponse.json({ tracks: rows.results || [] });
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await checkRateLimit(rateLimitKey("admin:create-track", ip), 20, 60_000);
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
  const parsed = createTrackSchema.safeParse(body);
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

  const id = "t_" + Math.random().toString(36).slice(2, 12);
  const {
    title,
    artist_id,
    album_id,
    duration,
    genre,
    audio_source_type,
    audio_source_reference,
    artwork_url,
    track_number,
    is_available,
    status,
  } = parsed.data;

  await db
    .prepare(
      "INSERT INTO tracks (id, title, artist_id, album_id, duration, genre, audio_source_type, audio_source_reference, artwork_url, track_number, is_available, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
    )
    .bind(
      id,
      title,
      artist_id ?? null,
      album_id ?? null,
      duration ?? 0,
      genre ?? null,
      audio_source_type,
      audio_source_reference ?? null,
      artwork_url ?? null,
      track_number ?? null,
      is_available ? 1 : 0,
      status,
    )
    .run();

  await auditLog(db, {
    userId: u.id,
    action: "create_track",
    targetType: "track",
    targetId: id,
  });

  return NextResponse.json({
    success: true,
    track: { id, title, artist_id, album_id, duration, genre, is_available, status },
  });
}
