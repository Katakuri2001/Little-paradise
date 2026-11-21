import { NextResponse } from "next/server";
import { TRACKS } from "@/lib/demo-data";
import { getDBWithDemoData } from "@/lib/server/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const db = await getDBWithDemoData();
  if (db) {
    try {
      const row = await db.prepare("SELECT * FROM tracks WHERE id = ?").bind(id).first();
      if (!row) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ track: row });
    } catch {
      // fall through to demo data
    }
  }

  const t = TRACKS.find((x) => x.id === id);
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ track: t });
}
