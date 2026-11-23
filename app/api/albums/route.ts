import { NextResponse } from "next/server";
import { getDB } from "@/lib/server/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  const db = getDB();
  if (!db) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "Database unavailable" } },
      { status: 503 },
    );
  }

  if (id) {
    const row = await db.prepare("SELECT * FROM albums WHERE id = ?").bind(id).first();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ album: row });
  }

  const rows = await db.prepare("SELECT * FROM albums ORDER BY release_date DESC").all();
  return NextResponse.json({ albums: rows.results || [] });
}
