import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getDBWithDemoData } from "@/lib/server/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { id: userId } = await params;
  const rows = await db
    .prepare(
      "SELECT f.followee_id as id, f.created_at FROM follows f WHERE f.follower_id = ? ORDER BY f.created_at DESC",
    )
    .bind(userId)
    .all();

  return NextResponse.json({ following: rows.results || [] });
}
