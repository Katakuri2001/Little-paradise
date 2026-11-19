import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getDBWithDemoData } from "@/lib/server/db";
import { auditLog } from "@/lib/server/audit-log";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") {
    return NextResponse.json(
      {
        error: {
          code: u ? "FORBIDDEN" : "UNAUTHORIZED",
          message: u ? "Forbidden" : "Unauthorized",
        },
      },
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
  const row = await db
    .prepare("SELECT * FROM lyrics WHERE track_id = ?")
    .bind(id)
    .first();

  if (!row) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Lyrics not found for this track" } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    track_id: row.track_id,
    offset: row.synchronization_offset || 0,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") {
    return NextResponse.json(
      {
        error: {
          code: u ? "FORBIDDEN" : "UNAUTHORIZED",
          message: u ? "Forbidden" : "Unauthorized",
        },
      },
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
  const body = await req.json();
  const { offset } = body as { offset?: number };

  if (offset === undefined || typeof offset !== "number") {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "offset is required and must be a number" } },
      { status: 400 },
    );
  }

  // Check if lyrics row exists
  const existing = await db
    .prepare("SELECT * FROM lyrics WHERE track_id = ?")
    .bind(id)
    .first();

  if (!existing) {
    // Insert new lyrics row with offset
    await db
      .prepare(
        "INSERT INTO lyrics (track_id, format, language, lyrics_content, synchronization_offset, created_at, updated_at) VALUES (?, 'lrc', 'en', '', ?, datetime('now'), datetime('now'))",
      )
      .bind(id, offset)
      .run();
    await auditLog(db, {
      userId: u.id,
      action: "update_lyrics",
      targetType: "track",
      targetId: id,
    });
    return NextResponse.json({ track_id: id, offset });
  }

  // Update existing lyrics offset
  await db
    .prepare(
      "UPDATE lyrics SET synchronization_offset = ?, updated_at = datetime('now') WHERE track_id = ?"
    )
    .bind(offset, id)
    .run();

  await auditLog(db, {
    userId: u.id,
    action: "update_lyrics",
    targetType: "track",
    targetId: id,
  });

  return NextResponse.json({ track_id: id, offset });
}