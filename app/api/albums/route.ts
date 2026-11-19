import { NextResponse } from "next/server";
import { ALBUMS, TRACKS } from "@/lib/demo-data";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    const a = ALBUMS.find((x) => x.id === id);
    if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ album: a, tracks: TRACKS.filter((t) => t.albumId === id) });
  }
  return NextResponse.json({ albums: ALBUMS });
}
