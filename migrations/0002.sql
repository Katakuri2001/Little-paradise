-- Little Paradise D1 Schema v2 — Additive changes only
-- Preserves all existing tables and data from 0001_init.sql

-- Users: role + status (additive, defaults for existing rows)
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';

-- Tracks: production metadata + recommendation fields (additive)
ALTER TABLE tracks ADD COLUMN bpm REAL;
ALTER TABLE tracks ADD COLUMN energy REAL;
ALTER TABLE tracks ADD COLUMN valence REAL;
ALTER TABLE tracks ADD COLUMN loudness REAL;
ALTER TABLE tracks ADD COLUMN explicit INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tracks ADD COLUMN isrc TEXT;
ALTER TABLE tracks ADD COLUMN status TEXT DEFAULT 'published';

-- Social: follows (user-to-user)
CREATE TABLE IF NOT EXISTS follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(follower_id, followee_id)
);

-- Social: public listening activity
CREATE TABLE IF NOT EXISTS listening_activity (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  played_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_public INTEGER NOT NULL DEFAULT 1
);

-- Social: playlist collaborators
CREATE TABLE IF NOT EXISTS playlist_collaborators (
  id TEXT PRIMARY KEY,
  playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(playlist_id, user_id)
);

-- Social: listening rooms (synchronized playback — architecture prepared)
CREATE TABLE IF NOT EXISTS listening_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public INTEGER NOT NULL DEFAULT 0,
  current_track_id TEXT REFERENCES tracks(id) ON DELETE SET NULL,
  current_time REAL NOT NULL DEFAULT 0,
  is_playing INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS room_sessions (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES listening_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  left_at TEXT
);

-- Social: playlist reactions
CREATE TABLE IF NOT EXISTS playlist_reactions (
  id TEXT PRIMARY KEY,
  playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(playlist_id, user_id)
);

-- Backend: app settings (key-value store for admin)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Backend: audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON listening_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_public ON listening_activity(is_public, played_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_tracks_status ON tracks(status);
CREATE INDEX IF NOT EXISTS idx_tracks_bpm ON tracks(bpm);
