import { NextResponse } from "next/server";
import { getDB } from "@/lib/server/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
  if (!q) return NextResponse.json({ tracks: [], artists: [], albums: [], playlists: [] });

  const db = getDB();
  if (!db) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "Database unavailable" } },
      { status: 503 },
    );
  }

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
}
