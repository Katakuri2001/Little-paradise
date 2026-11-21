import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getDBWithDemoData } from "@/lib/server/db";
import { auditLog } from "@/lib/server/audit-log";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await getCurrentUser();
  if (!u) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const db = await getDBWithDemoData();
  if (!db) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "Database unavailable" } },
      { status: 503 },
    );
  }

  const { id: followeeId } = await params;
  if (followeeId === u.id) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Cannot follow yourself" } },
      { status: 400 },
    );
  }

  const id = "fo_" + Math.random().toString(36).slice(2, 12);
  await db
    .prepare(
      "INSERT OR IGNORE INTO follows (id, follower_id, followee_id, created_at) VALUES (?, ?, ?, datetime('now'))",
    )
    .bind(id, u.id, followeeId)
    .run();

  await auditLog(db, {
    userId: u.id,
    action: "follow_user",
    targetType: "user",
    targetId: followeeId,
  });

  return NextResponse.json({ success: true, followeeId });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await getCurrentUser();
  if (!u) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const db = await getDBWithDemoData();
  if (!db) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "Database unavailable" } },
      { status: 503 },
    );
  }

  const { id: followeeId } = await params;
  await db
    .prepare("DELETE FROM follows WHERE follower_id = ? AND followee_id = ?")
    .bind(u.id, followeeId)
    .run();

  await auditLog(db, {
    userId: u.id,
    action: "unfollow_user",
    targetType: "user",
    targetId: followeeId,
  });

  return NextResponse.json({ success: true, followeeId });
}
