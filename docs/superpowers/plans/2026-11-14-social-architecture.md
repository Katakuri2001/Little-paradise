# Social Features Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the data model and route skeletons for social features so they can be implemented incrementally later. No UI, no server logic, no real-time sync in this phase. Schema + types + route skeletons only.

**Architecture:** Additive D1 migration (preserves all existing data), new TypeScript types in `lib/types.ts`, placeholder API route files under `app/api/social/*` that return 401/unauthenticated or 501/empty. No frontend UI components.

**Tech Stack:** D1 (SQLite dialect), Next.js 15 App Router API routes, TypeScript

**Spec:** docs/superpowers/specs/2026-11-14-social-architecture-design.md

## Global Constraints
- Additive migrations only — no `DROP`, no `ALTER ... DROP COLUMN`, preserves existing data
- No server logic — route skeletons return 401 (unauthenticated) or 501 (not implemented) or empty arrays
- No UI, no WebSocket, no real-time sync (listening rooms architecture prepared only)
- TypeScript strict mode
- Backward-compatible: `role`/`status` optional on `User` type

## Review Focus
1. Migration `0002` is additive and preserves all existing tables/rows
2. `users.role` and `users.status` have defaults ('user', 'active') so existing rows are valid
3. Route skeletons return 401 when no session, 501/empty when unimplemented
4. New types compile under strict TypeScript
5. No existing route or component is modified or removed

### Task 1: Create additive migration `0002_social_backend.sql`

**Files:**
- Create: `migrations/0002_social_backend.sql`

**Interfaces:**
- SQL that adds `role`/`status` to `users`, creates `follows`, `listening_activity`, `playlist_collaborators`, `listening_rooms`, `room_sessions`, `playlist_reactions`, `app_settings`, `audit_log` tables, and adds `bpm`/`energy`/`valence`/`loudness`/`explicit`/`isrc`/`status` to `tracks`
- All `ALTER TABLE ... ADD COLUMN ... DEFAULT` (additive)
- All `CREATE TABLE IF NOT EXISTS`

- [ ] **Step 1: Write migration SQL**

```sql
-- Users: role + status (additive, defaults for existing rows)
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';

-- Tracks: production metadata (additive)
ALTER TABLE tracks ADD COLUMN bpm REAL;
ALTER TABLE tracks ADD COLUMN energy REAL;
ALTER TABLE tracks ADD COLUMN valence REAL;
ALTER TABLE tracks ADD COLUMN loudness REAL;
ALTER TABLE tracks ADD COLUMN explicit INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tracks ADD COLUMN isrc TEXT;
ALTER TABLE tracks ADD COLUMN status TEXT DEFAULT 'published';

-- Social: follows
CREATE TABLE IF NOT EXISTS follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(follower_id, followee_id)
);

-- Social: listening activity (public-facing)
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

-- Social: listening rooms
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

-- Backend: app settings + audit log
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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
```

- [ ] **Step 2: Verify migration is syntactically valid**

Run: `npx wrangler d1 migrations apply little_paradise_db --dry-run` (if D1 available locally) or inspect SQL manually for D1/SQLite compatibility

Expected: No syntax errors; all `ADD COLUMN` and `CREATE TABLE IF NOT EXISTS`

- [ ] **Step 3: Commit**

```bash
git add migrations/0002_social_backend.sql
git commit -m "feat: add additive social + backend migration 0002"
```

### Task 2: Add social types to `lib/types.ts`

**Files:**
- Modify: `lib/types.ts`

**Interfaces:**
- `UserRole = 'user' | 'admin'`, `UserStatus = 'active' | 'suspended'`
- `User.role?: UserRole`, `User.status?: UserStatus`
- New types: `Follow`, `ListeningActivity`, `PlaylistCollaborator`, `ListeningRoom`, `RoomSession`, `PlaylistReaction`

- [ ] **Step 1: Add types to `lib/types.ts`**

```ts
export type UserRole = "user" | "admin";
export type UserStatus = "active" | "suspended";

export type User = {
  // ... existing fields ...
  role?: UserRole;
  status?: UserStatus;
};

export type Follow = {
  id: string;
  followerId: string;
  followeeId: string;
  createdAt: string;
};

export type ListeningActivity = {
  id: string;
  userId: string;
  trackId: string;
  playedAt: string;
  isPublic: boolean;
};

export type PlaylistCollaborator = {
  id: string;
  playlistId: string;
  userId: string;
  role: "owner" | "editor" | "viewer";
  createdAt: string;
};

export type ListeningRoom = {
  id: string;
  name: string;
  ownerId: string;
  isPublic: boolean;
  currentTrackId?: string;
  currentTime: number;
  isPlaying: boolean;
  updatedAt: string;
};

export type RoomSession = {
  id: string;
  roomId: string;
  userId: string;
  joinedAt: string;
  leftAt?: string;
};

export type PlaylistReaction = {
  id: string;
  playlistId: string;
  userId: string;
  reaction: string;
  createdAt: string;
};
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add social feature types to lib/types"
```

### Task 3: Create route skeleton `POST/DELETE /api/social/follow/[id]`

**Files:**
- Create: `app/api/social/follow/[id]/route.ts`

**Interfaces:**
- `GET /api/social/followers/[id]` and `GET /api/social/following/[id]` (see Task 4)
- This route: `POST` follows a user, `DELETE` unfolds. Returns 401 if no session, 501 if unimplemented.

- [ ] **Step 1: Create route file**

```ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  return NextResponse.json({ error: { code: "NOT_IMPLEMENTED", message: "Follow not yet implemented" } }, { status: 501 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  return NextResponse.json({ error: { code: "NOT_IMPLEMENTED", message: "Unfollow not yet implemented" } }, { status: 501 });
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/api/social/follow/[id]/route.ts
git commit -m "feat: add follow/unfollow route skeleton (501)"
```

### Task 4: Create route skeletons for followers/following/activity

**Files:**
- Create: `app/api/social/followers/[id]/route.ts`
- Create: `app/api/social/following/[id]/route.ts`
- Create: `app/api/social/activity/route.ts`
- Create: `app/api/social/activity/[userId]/route.ts`

**Interfaces:**
- All return 401 if no session; `[]` (empty array) if authenticated (not yet implemented)

- [ ] **Step 1: Create all 4 route files**

Each: `GET` handler, `getCurrentUser()` check, return `NextResponse.json({ items: [] })` or 401.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/api/social/followers/[id]/route.ts app/api/social/following/[id]/route.ts app/api/social/activity/route.ts app/api/social/activity/[userId]/route.ts
git commit -m "feat: add followers/following/activity route skeletons"
```

### Task 5: Create route skeletons for listening rooms

**Files:**
- Create: `app/api/social/rooms/route.ts`
- Create: `app/api/social/rooms/[id]/route.ts`
- Create: `app/api/social/rooms/[id]/sessions/route.ts`

**Interfaces:**
- `GET/POST /api/social/rooms`, `GET/PATCH/DELETE /api/social/rooms/[id]`, `GET /api/social/rooms/[id]/sessions`
- All return 401 if no session; 501 or empty if unimplemented

- [ ] **Step 1: Create all 3 route files**

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/api/social/rooms/route.ts app/api/social/rooms/[id]/route.ts app/api/social/rooms/[id]/sessions/route.ts
git commit -m "feat: add listening rooms route skeletons"
```

### Task 6: Create route skeletons for playlist collaborators and reactions

**Files:**
- Create: `app/api/social/playlists/[id]/collaborators/route.ts`
- Create: `app/api/social/playlists/[id]/reactions/route.ts`

**Interfaces:**
- `GET/POST/DELETE /api/social/playlists/[id]/collaborators`, `POST/GET /api/social/playlists/[id]/reactions`
- All return 401 if no session; 501 or empty if unimplemented

- [ ] **Step 1: Create both route files**

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/api/social/playlists/[id]/collaborators/route.ts app/api/social/playlists/[id]/reactions/route.ts
git commit -m "feat: add playlist collaborators/reactions route skeletons"
```

### Task 7: Run full verification

**Files:** none

- [ ] **Step 1: Run lint**

Run: `npm run lint`

Expected: PASS

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: verify social architecture build passes lint, typecheck, tests"
```

---

**Self-review complete:** All spec requirements (users.role/status, follows, listening_activity, playlist_collaborators, listening_rooms, room_sessions, playlist_reactions, app_settings, audit_log, route skeletons for follow/followers/following/activity/rooms/collaborators/reactions, additive migration, no UI, no server logic) are covered by Tasks 1–7. No spec requirement lacks a task.

**Plan complete and saved to `docs/superpowers/plans/2026-11-14-social-architecture.md`.**
