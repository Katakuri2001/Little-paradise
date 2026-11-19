import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getDBWithDemoData } from "@/lib/server/db";

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

  const rows = await db
    .prepare("SELECT * FROM playlists ORDER BY createdAt DESC")
    .all();

  return NextResponse.json({
    playlists: rows.results || [],
  });
}
