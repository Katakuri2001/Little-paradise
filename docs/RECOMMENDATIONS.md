# Little Paradise — Post-Inspection Recommendations

Generated after full codebase inspection. Prioritized by impact and effort.

---

## Summary Table

| Priority | Area | Task | Effort | Impact |
|---|---|---|---|---|
| P0 | Admin | Implement missing Admin Tracks CRUD routes | ~2-3 routes | High |
| P0 | Admin | Wire up Admin Settings backend | ~1-2 routes | High |
| P1 | Data layer | Migrate frontend catalog from static demo-data to D1 | 4 routes | High |
| P1 | Data layer | Wire R2 streaming to actual track records | Cross-route | High |
| P2 | Security | Add rate limiting to more mutating endpoints | Middleware | Medium |
| P3 | UX | Sync library state (favorites/playlists/history) to server | Store + API | Medium |
| P3 | UX | Replace placeholder admin actions with real edit flows | UI + API | Medium |
| P3 | Roadmap | Activate prepared social features (follows, rooms, reactions) | New routes + UI | Low-Medium |

---

## P0 — Fix broken admin functionality (highest impact)

### P0-1. Implement missing Admin Tracks CRUD routes

**Problem:** The `/admin/tracks` page calls `GET/PATCH/DELETE /api/admin/tracks` and `/api/admin/tracks/[id]`, but **these route files do not exist**. The admin Tracks page is currently a non-functional shell that optimistically removes rows from the UI without ever contacting the server.

**Files to create:**

- `app/api/admin/tracks/route.ts`
  - `GET` — list tracks, optionally filtered by `status` (published/unpublished)
  - `POST` — create a new track record in D1

- `app/api/admin/tracks/[id]/route.ts`
  - `PATCH` — update track metadata (title, artist, album, genre, duration, status, `audio_source_reference`)
  - `DELETE` — remove a track record

**Pattern to follow** (copy from existing admin routes):

```ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getDBWithDemoData } from "@/lib/server/db";
import { auditLog } from "@/lib/server/audit-log";

export async function GET() {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") {
    return NextResponse.json(
      { error: { code: u ? "FORBIDDEN" : "UNAUTHORIZED", message: u ? "Forbidden" : "Unauthorized" } },
      { status: u ? 403 : 401 },
    );
  }
  const db = await getDBWithDemoData();
  if (!db) {
    return NextResponse.json({ error: { code: "UNAVAILABLE", message: "Database unavailable" } }, { status: 503 });
  }
  const rows = await db.prepare("SELECT * FROM tracks ORDER BY created_at DESC").all();
  return NextResponse.json({ tracks: rows.results || [] });
}

// PATCH and DELETE follow the same admin-guard + auditLog pattern
```

**Why P0:** This is a broken user journey. An admin clicks "Tracks" in the sidebar and cannot actually manage tracks.

---

### P0-2. Wire up Admin Settings backend

**Problem:** `app/admin/settings/page.tsx` has feature-flag checkboxes (Open Registration, Maintenance Mode, Demo Content Banner) and default inputs (Default Crossfade, Featured Mood) that only `console.log`. The `app_settings` table already exists in `migrations/0002.sql`, but there is no API to read or write it.

**File to create:**

- `app/api/admin/settings/route.ts`
  - `GET` — `SELECT * FROM app_settings` → return key-value map
  - `PATCH` — `UPSERT` (insert or update) individual settings key/value, with `updated_by` = admin user id, plus `auditLog`

**Why P0:** The Settings page is a prominent admin destination that currently does nothing. Wiring it makes the admin dashboard feel complete.

---

## P1 — Productionize the catalog (data layer)

### P1-1. Migrate frontend catalog from static demo-data to D1

**Problem:** `app/api/tracks`, `/api/artists`, `/api/albums`, `/api/search` all read from `lib/demo-data.ts` (hardcoded TypeScript arrays). The D1 tables for `tracks`, `artists`, `albums` already exist in `migrations/0001_init.sql` but are unused by these routes. This means the app is a demo, not a real streaming service — content cannot be managed through the database.

**Routes to convert:**

| Route | Current source | Target D1 table |
|---|---|---|
| `GET /api/tracks` | `TRACKS` array | `tracks` |
| `GET /api/tracks/[id]` | `TRACKS.find(...)` | `tracks` |
| `GET /api/artists` | `ARTISTS` array | `artists` |
| `GET /api/artists/[id]` (via `?id=` param) | `ARTISTS.find(...)` | `artists` |
| `GET /api/albums` | `ALBUMS` array | `albums` |
| `GET /api/albums/[id]` (via `?id=` param) | `ALBUMS.find(...)` | `albums` |
| `GET /api/search` | all four arrays | full-text/ILIKE across `tracks`, `artists`, `albums`, `playlists` |

**Recommendation:** Convert these to D1 queries using `getDBWithDemoData()`, keeping `demo-data.ts` as a seed/fallback for local development when D1 is unavailable.

**Why P1:** Without this, admin-created tracks/artists/albums never appear in the frontend catalog. The admin and frontend are disconnected at the data layer.

---

### P1-2. Wire R2 streaming to actual track records

**Problem:** `GET /api/tracks/[id]/stream` is fully implemented — it reads `track.audio_source_reference` from D1 and streams from R2 `BUCKET` with HTTP Range (206) support. However, demo tracks use `audioUrl: "/audio/track1.mp3"` (public folder) and do **not** populate `audio_source_reference`. The admin upload flow (`POST/PUT /api/admin/uploads`) writes files to R2, but nothing connects an uploaded file to a D1 `tracks` row that the stream endpoint can read.

**Connection needed:**

1. Admin uploads a file → `POST /api/admin/uploads` returns `{ key, uploadUrl }` → client `PUT`s file to R2.
2. Admin creates a track record → `POST /api/admin/tracks` stores `audio_source_reference = <R2 key>` in `tracks` table.
3. Frontend `playTrack(track)` uses `GET /api/tracks/[id]/stream` instead of `track.audioUrl` → R2 stream with seeking support.

**Why P1:** This closes the loop between admin uploads and actual playback. Without it, uploaded content is unplayable through the app's own streaming endpoint.

---

## P2 — Security hardening

### P2-1. Add rate limiting to more mutating endpoints

**Problem:** Rate limiting (`checkRateLimit` from `lib/server/rate-limit.ts`) currently exists only on `register` (5 req/60s) and `login` (10 req/60s) per IP. Other mutating endpoints are unprotected:

- `POST /api/me/favorites/[trackId]`
- `POST/DELETE /api/playlists`, `POST/DELETE /api/playlists/[id]/tracks`
- `PATCH /api/me/preferences`
- `POST /api/me/history`
- All `POST/PUT/PATCH/DELETE` under `/api/admin/*`

**Recommendation:** Add `checkRateLimit(rateLimitKey("<action>", ip), limit, windowMs)` to the most abused mutating endpoints, especially admin write routes and favorite/playlist toggles.

**Why P2:** Prevents brute-force, spam, and abuse without adding external dependencies.

---

## P3 — Polish & UX

### P3-1. Sync library state to server (not just localStorage)

**Problem:** `libraryStore` and `playerStore` persist only to `localStorage` (`little-paradise-library`, `little-paradise-player`). Favorites, playlists, listening history, and preferences created while logged in are **not** written to D1 (`user_favorites`, `playlists`, `listening_history`, `user_preferences` tables exist but are unused by the frontend). On a new device or after clearing browser data, the user's library is empty.

**Flow to implement:**

1. On successful login/register: hydrate `libraryStore` from `GET /api/me/favorites`, `GET /api/playlists`, `GET /api/me/history`, `GET /api/me/preferences`.
2. On mutations (toggle favorite, create/update/delete playlist, add history): write optimistically to localStore **and** to the corresponding server API (`POST/DELETE /api/me/favorites/[trackId]`, `POST/PATCH/DELETE /api/playlists/*`, `POST /api/me/history`).
3. Handle offline gracefully (queue mutations, sync on reconnect).

**Why P3:** Multi-device persistence is a core expectation for a music streaming app.

---

### P3-2. Replace placeholder admin actions with real edit flows

**Problem:** Admin tables for Users, Tracks, Artists, Playlists have actions like "Edit", "Curate", "Promote", "Suspend" that are either no-ops (`console.log`) or optimistically remove rows from the UI without server confirmation.

**Files to enhance:**
- `app/admin/users/page.tsx` — Promote/Suspend/Delete already hit real APIs; "Edit" needs a user detail modal.
- `app/admin/tracks/page.tsx` — Edit/Unpublish/Delete need real API backing (see P0-1) and a track edit modal.
- `app/admin/artists/page.tsx` — Edit needs a real artist update form backed by `PATCH /api/admin/artists/[id]`.
- `app/admin/playlists/page.tsx` — Curate/Feature/Delete need real forms and confirmation.

**Why P3:** Admin actions that don't persist or confirm erode trust in the dashboard.

---

### P3-3. Activate prepared social features

**Problem:** `migrations/0002.sql` defines `follows`, `listening_activity`, `playlist_collaborators`, `listening_rooms`, `playlist_reactions` — and `lib/types.ts` has matching TypeScript types — but there are **zero** API routes or UI components that consume them.

**Candidate next features:**
- Follow/unfollow users → `POST/DELETE /api/social/follow/[id]` (route stubs exist but are not wired to D1 `follows` table)
- Listening rooms / synchronized playback → `listening_rooms` + `room_sessions` tables (architecture prepared)
- Playlist reactions/collaborators → `playlist_reactions` + `playlist_collaborators` tables

**Why P3:** These are future roadmap items, not blocking current functionality. Activate only when social features are prioritized.

---

## Suggested implementation order

```
Week 1:  P0-1 (Admin Tracks CRUD) + P0-2 (Admin Settings API)
Week 2:  P1-1 (D1-backed catalog) + P1-2 (R2 stream wiring)
Week 3:  P2-1 (Rate limiting) + P3-2 (Admin edit modals)
Week 4+: P3-1 (Server sync of library state) + P3-3 (Social features)
```

---

## Related documents

- `docs/WORKFLOW.md` — Full system workflow (frontend, admin, and connections between them)
- `docs/project-details.md` — Project details
- `docs/stitch/screens/` — UI screen references
- `AGENTS.md` — Project agent notes
