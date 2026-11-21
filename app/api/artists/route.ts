import { NextResponse } from "next/server";
import { ARTISTS } from "@/lib/demo-data";
import { getDBWithDemoData } from "@/lib/server/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  const db = await getDBWithDemoData();
  if (db) {
    try {
      if (id) {
        const row = await db.prepare("SELECT * FROM artists WHERE id = ?").bind(id).first();
        if (!row) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return NextResponse.json({ artist: row });
      }
      const rows = await db.prepare("SELECT * FROM artists ORDER BY name ASC").all();
      return NextResponse.json({ artists: rows.results || [] });
    } catch {
      // fall through to demo data
    }
  }

  if (id) {
    const a = ARTISTS.find((x) => x.id === id);
    if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ artist: a });
  }
  return NextResponse.json({ artists: ARTISTS });
}
