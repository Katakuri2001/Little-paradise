import { NextResponse } from "next/server";
import { TRACKS, ARTISTS, ALBUMS, PLAYLISTS } from "@/lib/demo-data";
import { getDBWithDemoData } from "@/lib/server/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
  if (!q) return NextResponse.json({ tracks: [], artists: [], albums: [], playlists: [] });

  const db = await getDBWithDemoData();
  if (db) {
    try {
      const like = `%${q}%`;
      const tracks = await db
        .prepare(
          "SELECT * FROM tracks WHERE lower(title) LIKE ? OR lower(genre) LIKE ? ORDER BY created_at DESC LIMIT 20",
        )
        .bind(like, like)
        .all();
      const artists = await db
        .prepare("SELECT * FROM artists WHERE lower(name) LIKE ? ORDER BY name ASC LIMIT 20")
        .bind(like)
        .all();
      const albums = await db
        .prepare("SELECT * FROM albums WHERE lower(title) LIKE ? ORDER BY release_date DESC LIMIT 20")
        .bind(like)
        .all();
      const playlists = await db
        .prepare("SELECT * FROM playlists WHERE lower(name) LIKE ? ORDER BY created_at DESC LIMIT 20")
        .bind(like)
        .all();
      return NextResponse.json({
        tracks: tracks.results || [],
        artists: artists.results || [],
        albums: albums.results || [],
        playlists: playlists.results || [],
      });
    } catch {
      // fall through to demo data
    }
  }

  return NextResponse.json({
    tracks: TRACKS.filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.album.toLowerCase().includes(q)),
    artists: ARTISTS.filter((a) => a.name.toLowerCase().includes(q)),
    albums: ALBUMS.filter((a) => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)),
    playlists: PLAYLISTS.filter((p) => p.name.toLowerCase().includes(q)),
  });
}
