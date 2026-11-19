import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getDBWithDemoData } from "@/lib/server/db";
import { auditLog } from "@/lib/server/audit-log";

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

  const [userCount, trackCount, playlistCount] = await Promise.all([
    db.prepare("SELECT COUNT(*) as count FROM users").first(),
    db.prepare("SELECT COUNT(*) as count FROM tracks").first(),
    db.prepare("SELECT COUNT(*) as count FROM playlists").first(),
  ]);

  await auditLog(db, {
    userId: u.id,
    action: "view_stats",
    targetType: "system",
  });

  return NextResponse.json({
    stats: {
      users: (userCount as { count: number } | null)?.count || 0,
      tracks: (trackCount as { count: number } | null)?.count || 0,
      playlists: (playlistCount as { count: number } | null)?.count || 0,
    },
  });
}
