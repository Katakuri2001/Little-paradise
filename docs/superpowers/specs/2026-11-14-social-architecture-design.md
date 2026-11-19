# Social Features — Architecture Spec (Prepare Only)

**Sub-project:** Stream E — Social Features  
**Status:** Proposed — Architecture only, no implementation  
**Date:** 2026-11-14  
**Related:** Foundation & Security (RBAC deferred to last phase)

---

## 1. Intent & Scope

Prepare the data model and route skeletons for social features so they can be implemented incrementally later. **No UI, no server logic, no real-time sync** in this phase. This is pure schema + type preparation.

**Features prepared (not built):**
- Public user profiles
- Following users
- Public playlists
- Collaborative playlists
- Listening activity
- Playlist reactions
- Listening rooms with synchronized playback (architecture only)

---

## 2. Database Additions (Additive Migrations Only)

New migration `0002_social.sql` — additive, preserves all existing data:

```sql
-- Users: role + status (additive, defaults)
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(follower_id, followee_id)
);

-- Listening activity (public-facing)
CREATE TABLE IF NOT EXISTS listening_activity (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  played_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_public INTEGER NOT NULL DEFAULT 1
);

-- Playlist collaborators
CREATE TABLE IF NOT EXISTS playlist_collaborators (
  id TEXT PRIMARY KEY,
  playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor',  -- owner, editor, viewer
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(playlist_id, user_id)
);

-- Listening rooms
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

-- Playlist reactions
CREATE TABLE IF NOT EXISTS playlist_reactions (
  id TEXT PRIMARY KEY,
  playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,  -- like, love, etc.
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(playlist_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON listening_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_public ON listening_activity(is_public, played_at);
```

---

## 3. Type Definitions (Additive)

**`lib/types.ts`:**
```ts
export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';

export type User = {
  // ... existing fields ...
  role?: UserRole;        // additive
  status?: UserStatus;    // additive
};

export type Follow = { id, followerId, followeeId, createdAt };
export type ListeningActivity = { id, userId, trackId, playedAt, isPublic };
export type PlaylistCollaborator = { id, playlistId, userId, role, createdAt };
export type ListeningRoom = { id, name, ownerId, isPublic, currentTrackId, currentTime, isPlaying, updatedAt };
export type RoomSession = { id, roomId, userId, joinedAt, leftAt };
export type PlaylistReaction = { id, playlistId, userId, reaction, createdAt };
```

---

## 4. Route Skeletons (Placeholder, Return 501 or Empty)

New route files that exist but return not-yet-implemented responses:

| Route | Method | Response |
|-------|--------|----------|
| `/api/social/follow/[id]` | POST/DELETE | `501 Not Implemented` |
| `/api/social/followers/[id]` | GET | `[]` (empty) |
| `/api/social/following/[id]` | GET | `[]` (empty) |
| `/api/social/activity` | GET | `[]` (empty) |
| `/api/social/activity/[userId]` | GET | `[]` (empty) |
| `/api/social/rooms` | GET/POST | `[]` / `501` |
| `/api/social/rooms/[id]` | GET/PATCH/DELETE | `501` |
| `/api/social/rooms/[id]/sessions` | GET | `[]` |
| `/api/social/playlists/[id]/collaborators` | GET/POST/DELETE | `[]` / `501` |
| `/api/social/playlists/[id]/reactions` | POST/GET | `501` / `[]` |

Each skeleton imports `getCurrentUser` and returns `401` if unauthenticated, establishing the auth pattern early.

---

## 5. Files Touched

**New:**
- `migrations/0002_social.sql`
- `app/api/social/follow/[id]/route.ts`
- `app/api/social/followers/[id]/route.ts`
- `app/api/social/following/[id]/route.ts`
- `app/api/social/activity/route.ts`
- `app/api/social/activity/[userId]/route.ts`
- `app/api/social/rooms/route.ts`
- `app/api/social/rooms/[id]/route.ts`
- `app/api/social/rooms/[id]/sessions/route.ts`
- `app/api/social/playlists/[id]/collaborators/route.ts`
- `app/api/social/playlists/[id]/reactions/route.ts`

**Modified:**
- `lib/types.ts` — `UserRole`, `UserStatus`, optional `role`/`status` on `User`, new social types

---

## 6. Design Decisions

| Decision | Rationale |
|----------|-----------|
| Additive migrations only | Preserves existing data; safe to run on production D1 |
| Route skeletons return 501/empty | Establishes auth pattern and route structure; no fake data |
| No WebSocket/Sync yet | Listening rooms architecture prepared; real-time sync deferred |
| `role`/`status` optional on `User` | Backward-compatible until Foundation phase populates them |

---

## 7. Compatibility

- D1: All SQL is D1-compatible (SQLite dialect).
- Cloudflare Workers: Route skeletons are standard Next.js API routes.
- TypeScript strict: All new types explicit.

---

**Approval requested:** Please confirm this architecture spec. No implementation will be done in this phase — preparation only.