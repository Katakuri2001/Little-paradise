/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcryptjs";

/**
 * Demo data for the admin dashboard. Only inserted when tables are empty.
 * Never used in production - this is strictly for demonstration.
 */
const DEMO_USERS = [
  {
    id: "u_admin",
    email: "admin@example.com",
    username: "admin",
    displayName: "Admin",
    password: "admin123",
    role: "admin",
    status: "active",
    avatarSeed: 1,
  },
  {
    id: "u_listener",
    email: "listener@example.com",
    username: "listener",
    displayName: "Listener",
    password: "listener123",
    role: "user",
    status: "active",
    avatarSeed: 2,
  },
  {
    id: "u_suspended",
    email: "suspended@example.com",
    username: "suspended",
    displayName: "Suspended",
    password: "suspended123",
    role: "user",
    status: "suspended",
    avatarSeed: 3,
  },
];

const DEMO_ARTISTS = [
  { id: "a_demo1", name: "Aurora Vale", biography: "Dream-pop vocalist crafting midnight soundscapes.", image_url: null, created_at: "2026-01-01T00:00:00Z" },
  { id: "a_demo2", name: "Nocturne Theory", biography: "Electronic producer blending ambient textures.", image_url: null, created_at: "2026-01-02T00:00:00Z" },
  { id: "a_demo3", name: "Solstice", biography: "Acoustic songwriter of golden-hour ballads.", image_url: null, created_at: "2026-01-03T00:00:00Z" },
];

const DEMO_ALBUMS = [
  { id: "al_demo1", title: "Midnight Paradise", artist_id: "a_demo1", artwork_url: null, release_date: "2025-09-12", created_at: "2026-01-01T00:00:00Z" },
  { id: "al_demo2", title: "Neon Tides", artist_id: "a_demo2", artwork_url: null, release_date: "2025-06-03", created_at: "2026-01-02T00:00:00Z" },
  { id: "al_demo3", title: "Golden Hour", artist_id: "a_demo3", artwork_url: null, release_date: "2024-11-20", created_at: "2026-01-03T00:00:00Z" },
];

const DEMO_TRACKS = [
  { id: "t_demo1", title: "Welcome to Paradise", album_id: "al_demo1", artist_id: "a_demo1", duration: 372.7, audio_source_type: "r2", audio_source_reference: "audio/track1.mp3", artwork_url: null, track_number: 1, genre: "Dream Pop", is_available: 1, artist_name: "Aurora Vale", album_title: "Midnight Paradise", created_at: "2026-01-01T00:00:00Z" },
  { id: "t_demo2", title: "Starlit Lullaby", album_id: "al_demo1", artist_id: "a_demo1", duration: 425.95, audio_source_type: "r2", audio_source_reference: "audio/track2.mp3", artwork_url: null, track_number: 2, genre: "Dream Pop", is_available: 1, artist_name: "Aurora Vale", album_title: "Midnight Paradise", created_at: "2026-01-01T00:00:00Z" },
  { id: "t_demo3", title: "Neon Drift", album_id: "al_demo2", artist_id: "a_demo2", duration: 344.08, audio_source_type: "r2", audio_source_reference: "audio/track3.mp3", artwork_url: null, track_number: 1, genre: "Electronic", is_available: 1, artist_name: "Nocturne Theory", album_title: "Neon Tides", created_at: "2026-01-02T00:00:00Z" },
  { id: "t_demo4", title: "Ocean Pulse", album_id: "al_demo2", artist_id: "a_demo2", duration: 302.52, audio_source_type: "r2", audio_source_reference: "audio/track4.mp3", artwork_url: null, track_number: 2, genre: "Electronic", is_available: 1, artist_name: "Nocturne Theory", album_title: "Neon Tides", created_at: "2026-01-02T00:00:00Z" },
  { id: "t_demo5", title: "Golden Hour", album_id: "al_demo3", artist_id: "a_demo3", duration: 353.96, audio_source_type: "r2", audio_source_reference: "audio/track5.mp3", artwork_url: null, track_number: 1, genre: "Acoustic", is_available: 1, artist_name: "Solstice", album_title: "Golden Hour", created_at: "2026-01-03T00:00:00Z" },
  { id: "t_demo6", title: "Echoes of You", album_id: "al_demo3", artist_id: "a_demo3", duration: 279.64, audio_source_type: "r2", audio_source_reference: "audio/track6.mp3", artwork_url: null, track_number: 1, genre: "Indie", is_available: 1, artist_name: "Solstice", album_title: "Golden Hour", created_at: "2026-01-03T00:00:00Z" },
];

const DEMO_PLAYLISTS = [
  { id: "pl_demo1", user_id: "u_listener", name: "Late Night Dreams", description: "Soft songs for quiet hours.", artwork_url: null, is_public: 0, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "pl_demo2", user_id: "u_listener", name: "Focus Flow", description: "Instrumental energy for deep work.", artwork_url: null, is_public: 0, created_at: "2026-01-02T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" },
  { id: "pl_demo3", user_id: "u_admin", name: "Paradise Mix", description: "The best of Little Paradise.", artwork_url: null, is_public: 1, created_at: "2026-01-03T00:00:00Z", updated_at: "2026-01-03T00:00:00Z" },
];

const DEMO_PLAYLIST_TRACKS = [
  { playlist_id: "pl_demo1", track_id: "t_demo1", position: 1 },
  { playlist_id: "pl_demo1", track_id: "t_demo3", position: 2 },
  { playlist_id: "pl_demo1", track_id: "t_demo5", position: 3 },
  { playlist_id: "pl_demo2", track_id: "t_demo3", position: 1 },
  { playlist_id: "pl_demo2", track_id: "t_demo4", position: 2 },
  { playlist_id: "pl_demo3", track_id: "t_demo1", position: 1 },
  { playlist_id: "pl_demo3", track_id: "t_demo2", position: 2 },
  { playlist_id: "pl_demo3", track_id: "t_demo3", position: 3 },
  { playlist_id: "pl_demo3", track_id: "t_demo4", position: 4 },
  { playlist_id: "pl_demo3", track_id: "t_demo5", position: 5 },
  { playlist_id: "pl_demo3", track_id: "t_demo6", position: 6 },
];

export async function ensureDemoData(db: any): Promise<void> {
  // Check if users table already has data
  try {
    const existing = await db.prepare("SELECT COUNT(*) as count FROM users").first();
    if ((existing as any).count > 0) return;
  } catch {
    // Table might not exist yet - skip seeding
    return;
  }

  // Insert demo users with bcrypt-hashed passwords
  for (const u of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await db
      .prepare(
        "INSERT INTO users (id, email, username, displayName, password_hash, role, status, avatar_seed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
      )
      .bind(u.id, u.email, u.username, u.displayName, passwordHash, u.role, u.status, u.avatarSeed)
      .run();
  }

  // Insert artists
  for (const a of DEMO_ARTISTS) {
    await db
      .prepare(
        "INSERT INTO artists (id, name, biography, image_url, created_at) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(a.id, a.name, a.biography, a.image_url, a.created_at)
      .run();
  }

  // Insert albums
  for (const al of DEMO_ALBUMS) {
    await db
      .prepare(
        "INSERT INTO albums (id, title, artist_id, artwork_url, release_date, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(al.id, al.title, al.artist_id, al.artwork_url, al.release_date, al.created_at)
      .run();
  }

  // Insert tracks
  for (const t of DEMO_TRACKS) {
    await db
      .prepare(
        "INSERT INTO tracks (id, title, album_id, artist_id, duration, audio_source_type, audio_source_reference, artwork_url, track_number, genre, is_available, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        t.id,
        t.title,
        t.album_id,
        t.artist_id,
        t.duration,
        t.audio_source_type,
        t.audio_source_reference,
        t.artwork_url,
        t.track_number,
        t.genre,
        t.is_available,
        t.created_at
      )
      .run();
  }

  // Insert playlists
  for (const pl of DEMO_PLAYLISTS) {
    await db
      .prepare(
        "INSERT INTO playlists (id, user_id, name, description, artwork_url, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(pl.id, pl.user_id, pl.name, pl.description, pl.artwork_url, pl.is_public, pl.created_at, pl.updated_at)
      .run();
  }

  // Insert playlist tracks
  for (const pt of DEMO_PLAYLIST_TRACKS) {
    await db
      .prepare(
        "INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at) VALUES (?, ?, ?, datetime('now'))"
      )
      .bind(pt.playlist_id, pt.track_id, pt.position)
      .run();
  }
}
