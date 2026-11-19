import { NextResponse } from "next/server";
import { TRACKS } from "@/lib/demo-data";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    const t = TRACKS.find((x) => x.id === id);
    if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ track: t });
  }
  const limit = Number(url.searchParams.get("limit") ?? 50);
  return NextResponse.json({ tracks: TRACKS.slice(0, limit) });
}
