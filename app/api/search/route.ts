import { NextResponse } from "next/server";
import { TRACKS, ARTISTS, ALBUMS, PLAYLISTS } from "@/lib/demo-data";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
  if (!q) return NextResponse.json({ tracks: [], artists: [], albums: [], playlists: [] });
  return NextResponse.json({
    tracks: TRACKS.filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.album.toLowerCase().includes(q)),
    artists: ARTISTS.filter((a) => a.name.toLowerCase().includes(q)),
    albums: ALBUMS.filter((a) => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)),
    playlists: PLAYLISTS.filter((p) => p.name.toLowerCase().includes(q)),
  });
}
