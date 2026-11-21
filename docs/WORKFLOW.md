# Little Paradise — System Workflow Documentation

This document describes the end-to-end workflow of the **frontend website** (listener experience), the **admin dashboard** (administrator experience), and the **connections between them** (shared backend, API, database, storage, auth, and state).

> Project: Little Paradise — Premium music streaming & synchronized lyrics web app.
> Stack: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind + Framer Motion + Zustand.
> Backend: Cloudflare Workers via OpenNext adapter, backed by Cloudflare D1 (DB), R2 (assets), KV.

---

## 1. Project Overview & Architecture

### 1.1 Two distinct user experiences in one Next.js app

| Experience | Route prefix | Entry point | Primary users |
|---|---|---|---|
| Frontend website (music player) | `/` (and `/explore`, `/search`, `/library`, `/player`, …) | `app/layout.tsx` → `AppShell` | Listeners / registered users |
| Admin dashboard | `/admin/*` | `app/admin/layout.tsx` → `AdminLayout` + `AdminGuard` | Administrators (role `admin`) |

Both experiences run in the **same Next.js application** and share:
- The same API route surface under `app/api/*`
- The same session cookie (`lp_session`, HttpOnly, 7-day TTL)
- The same D1 database (`little_paradise_db`)
- The same R2 bucket (`little-paradise-assets`) for audio/assets
- The same Zustand store layer for client state

### 1.2 Core building blocks

| Layer | File(s) | Responsibility |
|---|---|---|
| Routing/shell | `app/layout.tsx`, `components/layout/AppShell.tsx` | Root layout, persistent AudioEngine, sidebar, mobile nav, bottom nav, persistent player bar |
| Admin shell | `app/admin/layout.tsx`, `components/layout/AdminLayout.tsx`, `components/layout/AdminGuard.tsx` | Admin sidebar, collapsed rail, role guard, "Exit Admin" link |
| Audio | `components/player/AudioEngine.tsx` | Single shared HTML5 `<audio>` instance surviving route changes; Web Audio gain node; Media Session API; BroadcastChannel cross-tab pause; retry with exponential backoff |
| State (player) | `lib/store/playerStore.ts` | Zustand store: queue, currentTrack, play/pause, seek, volume, shuffle, repeat, crossfade, sleep timer; persisted to localStorage |
| State (library) | `lib/store/libraryStore.ts` | Zustand store: user, auth, favorites, playlists, history, preferences; persisted to localStorage |
| Server store | `lib/server/store.ts` | Users, sessions, playlists, favorites, history, prefs (D1 with in-memory dev fallback) |
| Session (D1) | `lib/server/session-store.ts` | Persistent, revocable D1 sessions table |
| Auth helper | `lib/server/auth-helper.ts` | `lp_session` cookie read/write; `getCurrentUser()` |
| Middleware | `lib/server/middleware.ts` | Request lifecycle: public-path allow, session resolution, auth/admin enforcement, CSRF on mutating methods |
| API error helper | `lib/server/api.ts` | `jsonError`, `zodError`, `withErrorHandling` |
| DB binding | `lib/server/db.ts` | `getDB()` returns Cloudflare D1 binding (or null in local dev) |
| Demo data | `lib/demo-data.ts` | Static TRACKS, ARTISTS, ALBUMS, PLAYLISTS, MOODS, GENRES (used by frontend catalog & search) |
| LRC parser | `lib/lyrics/parseLrc.ts` | Parses LRC lyrics, word-level timing, active-line detection |
| Recommendations | `lib/recommendations/scoring.ts`, `shelves.ts`, `lib/hooks/useRecommendations.ts` | dailyMix / discoverWeekly / similar / followedReleases shelves |
| Migrations | `migrations/0001_init.sql`, `migrations/0002.sql` | D1 schema: users, artists, albums, tracks, lyrics, playlists, favorites, history, preferences, sessions, social tables, audit_log, app_settings |
| Config | `wrangler.jsonc` | D1 `DB`, R2 `BUCKET`, KV `KV`, vars `JWT_ISSUER`, `TOKEN_TTL_SECONDS` |

---

## 2. Frontend Website Workflow (Listener Experience)

### 2.1 App bootstrap & shell

1. User navigates to `https://<app>/`.
2. `app/layout.tsx` renders `<html lang="en" className="dark">`, loads Inter/Manrope fonts, then mounts:
   - `<AudioEngine />` — creates **one** `HTMLAudioElement` + Web Audio gain chain once (effect with `[]` deps). This instance survives all route changes, so playback never interrupts navigation.
   - `<AppShell>{children}</AppShell>` — the navigation shell.
3. `AppShell` (`components/layout/AppShell.tsx`) renders:
   - **Desktop sidebar** (lg:flex): Little Paradise logo, main nav (Home, Explore, Search, Library, Playlists, Favorites, Recently Played, Lyrics), Profile, Settings, and **Admin** link (only if `isAdminUser(user)`).
   - **Mobile top bar** (lg:hidden): menu toggle, logo, search.
   - **Mobile nav drawer** (AnimatePresence): same links as sidebar.
   - **Main content** (`<main>`): the route's page component.
   - **PersistentPlayerBar** (desktop, bottom): current track, play/pause, skip, seek, volume, favorite, queue, link to full player.
   - **MiniPlayer** (mobile, bottom): compact playback controls.
   - **QueueDrawer** (slide-over): current queue with reorder/remove.
   - **ToastHost**: ephemeral toasts (e.g. playlist deleted with undo).
   - Bottom mobile nav: Home, Explore, Search, Library, Likes.
   - `useKeyboardShortcuts`: Space (play/pause), ←/→ (prev/next), ↑/↓ (volume), n/p (next/prev), l (lyrics), s (shuffle), r (repeat), q (queue), / (search), ? (help), m (mute).

### 2.2 Authentication flow (listener)

All auth endpoints live under `app/api/auth/*` and use the `lp_session` HttpOnly cookie.

**Registration** — `POST /api/auth/register`
1. Client posts `{ email, password, username? }`.
2. Rate-limited (5 req / 60s per IP via `lib/server/rate-limit.ts`).
3. Body validated with `registerSchema` (Zod: email + min-6 password).
4. `createUser(email, password, username)` hashes password with bcryptjs (10 rounds), creates user record, seeds default playlists.
5. `createSession(userId)` issues a session token (D1 `sessions` table or in-memory dev Map).
6. `setSessionCookie(token)` sets `lp_session` (HttpOnly, secure in prod/preview, sameSite lax, path `/`, maxAge 7 days).
7. Returns `{ user: {...} }`.

**Login** — `POST /api/auth/login`
1. Client posts `{ email, password }`.
2. Rate-limited (10 req / 60s per IP).
3. `verifyUser(email, password)` looks up user and bcrypt-compares.
4. Session rotation: old `lp_session` cookie is deleted (`deleteSession`), new token created and set.
5. Returns `{ user: {...} }`.

**Logout** — `POST /api/auth/logout`
1. Deletes the session token from the store and clears the `lp_session` cookie.
2. Returns `{ ok: true }`.

**Session resolution** — `GET /api/auth/me`
1. `getCurrentUser()` reads `lp_session` cookie → `getSessionUser(token)` → resolves user from D1/in-memory.
2. Returns `{ user }` or `{ user: null }` (200 either way; client treats null as guest).

**Middleware enforcement** (`lib/server/middleware.ts`, `processRequest`)
- Public paths always allowed: `/`, `/explore`, `/search`, `/auth/*`, `/api/auth/*`, `/api/tracks`, `/api/artists`, `/api/albums`, `/api/search`, `/_next/*`, `/favicon.ico`.
- Auth-required paths: `/library`, `/profile`, `/settings`, `/api/me/*`, `/api/playlists/*`.
- Admin paths: `/admin/*` (require `role === "admin"`).
- On auth-required/admin paths with no resolved user: API routes get `401 UNAUTHORIZED`; pages get redirect to `/auth/login?next=<pathname>`.
- On admin paths with a non-admin user: `403 FORBIDDEN`.
- On mutating methods (POST/PUT/PATCH/DELETE): CSRF check — `Origin` header host must match request `Host`, else `403 CSRF_ERROR`.

### 2.3 Discovery & browsing (public, no auth required)

| Page | Route | Behavior |
|---|---|---|
| Home | `/` | Hero with featured track ("Play Featured" → `playTrack(featured, TRACKS)`), Quick Access (recent tracks), "Made for you" shelves, Daily Mix & Discover Weekly recommendation shelves (`useRecommendations`), Featured Playlists grid, Browse by Mood grid, Popular Artists scroll row. All catalog data comes from `lib/demo-data.ts` (static, client-side). |
| Explore | `/explore` | Trending tracks, New Releases (albums), Popular Artists, Genres pills, Mood Collections (filter via `?mood=<id>`). |
| Search | `/search` | Client-side fuzzy substring match across TRACKS/ARTISTS/ALBUMS/PLAYLISTS from demo data. Recent searches persisted in `libraryStore`. |
| Library | `/library` | Dashboard tiles: Liked Songs, Playlists, Followed Artists, Saved Albums, Recently Played, Uploaded Music. |
| Artists/[id] | `/artists/[id]` | Artist bio, follower count, Follow/Unfollow button, Albums grid, Top Tracks list (click → `playTrack(t, tracks)`). |

### 2.4 Playback (the core loop)

Playback is driven by `AudioEngine` + `playerStore` + `libraryStore`.

**Starting playback** — `playTrack(track, queue?)` (from any track card/button)
1. `playerStore.playTrack(track, queue)` sets `currentTrack`, `queue`, `queueIndex`, `isPlaying=true`, `currentTime=0`, `error=null`.
2. `AudioEngine` reacts to `currentTrack` change: loads `audioUrl` into the single `<audio>` element, applies crossfade (fade out → switch src → fade in) if `crossfadeLength > 0`, calls `audio.load()`.
3. `isPlaying` effect calls `audio.play()` (or `audio.pause()`).
4. `onEnded` → `addToHistory(trackId, duration)` then `next()` (respecting repeatMode: one/all/off).
5. Media Session API updates lock-screen/notification metadata and handles play/pause/prev/next/seekto from system media controls.
6. `BroadcastChannel("little-paradise-player")` posts `pause_others` when playing; other tabs pause their playback (single-tab audio policy).
7. `requestAnimationFrame` tick (~60fps) syncs `currentTime` into the store so the seek bar and lyrics highlight stay in sync.

**Player controls** (PersistentPlayerBar, MiniPlayer, Full Player `/player`)
- Play/Pause, Previous, Next, Shuffle, Repeat (off/all/one cycle), Seek (range input), Volume (range + mute toggle), Favorite (heart toggle via `libraryStore.toggleFavorite`).
- Full Player adds Artwork ↔ Lyrics mode toggle, parallax tilt on artwork, `AudioVisualizer` (AnalyserNode), background gradient per track seed.

**Lyrics** — `/lyrics` and `LyricsView` / `LyricsFullscreen`
- `GET /api/tracks/[id]/lyrics` returns parsed LRC lines (demo lyrics from `DEMO_LYRICS`, offset 0).
- `LyricsView`: highlights the active line (`findActiveLineIndex`), supports compact/immersive, lyrics themes (default/minimal/highlight/karaoke), font size, sync offset (from preferences), click-to-seek.
- `/lyrics` page: Compact/Immersive toggle, theme select, Fullscreen button → `LyricsFullscreen` (dedicated fullscreen overlay).

### 2.5 Library & social (auth required)

| Feature | Route | API | Store |
|---|---|---|---|
| Favorites | `/favorites` | `GET/POST/DELETE /api/me/favorites[/[trackId]]` | `libraryStore.favorites`, `toggleFavorite` |
| Playlists (user-owned) | `/playlists`, `/playlists/[id]` | `GET/POST /api/playlists`; `GET/PATCH/DELETE /api/playlists/[id]`; `POST/DELETE /api/playlists/[id]/tracks`; `PATCH /api/playlists/[id]/reorder` | `libraryStore.playlists`, CRUD + undo toast on delete |
| History | `/recent` | `GET/POST /api/me/history` | `libraryStore.history`, `addToHistory` (called by AudioEngine on track end) |
| Preferences | `/settings` | `GET/PATCH /api/me/preferences` | `libraryStore.preferences`, `setPreferences` |
| Profile | `/profile` | — (local store) | `libraryStore.user`, `favorites`, `playlists` |

### 2.6 Recommendations

`useRecommendations(shelf)` reads `favorites`, `history`, `preferences`, `currentTrack` from the stores and calls:
- `getDailyMix(TRACKS, userState)` — blend of favorites + history + preferred genres/moods.
- `getDiscoverWeekly(TRACKS, userState)` — tracks similar to taste profile.
- `getSimilarTracks(trackId, TRACKS, userState)` — similar to current track.
- `followedReleases` — tracks by followed artists.

Scoring lives in `lib/recommendations/scoring.ts`; shelf assembly in `lib/recommendations/shelves.ts`.

---

## 3. Admin Dashboard Workflow

### 3.1 Entry & access control

- `app/admin/page.tsx` redirects `/admin` → `/admin/dashboard`.
- `app/admin/layout.tsx` wraps all admin routes in `AdminLayout`.
- `AdminGuard` (`components/layout/AdminGuard.tsx`) — client-side: reads `user` from `libraryStore`; while `user === null` renders nothing (waiting for session); if `!isAdminUser(user)` redirects to `/`. Note: this is a **client-side UX guard only**; real enforcement is in middleware + API routes.
- Middleware (`processRequest`): `/admin/*` requires an authenticated user with `role === "admin"`, else `401` (API) / redirect-to-login (page) / `403` (non-admin).
- Every admin API route (`app/api/admin/*`) independently calls `getCurrentUser()` and returns `401`/`403` if the user is missing or not an admin. **Server-side RBAC is fully enforced on all mutations.**

### 3.2 Admin navigation (`AdminLayout.ADMIN_NAV`)

| Label | Route | Icon |
|---|---|---|
| Dashboard | `/admin/dashboard` | LayoutDashboard |
| Users | `/admin/users` | Users |
| Tracks | `/admin/tracks` | Music |
| Artists & Albums | `/admin/artists` | Disc |
| Playlists | `/admin/playlists` | List |
| Settings | `/admin/settings` | Settings |
| Analytics | `/admin/analytics` | BarChart3 |

Layout features: collapsible sidebar (desktop rail when collapsed), mobile header + drawer, "Exit Admin" link (→ `/`), persistent player bar (admin keeps listening while managing), toast host.

### 3.3 Admin Dashboard (`/admin/dashboard`)

1. `AdminGuard` wraps content.
2. On mount, fetches `GET /api/admin/stats` (cache: no-store).
3. Admin stat cards: Total Users, Total Tracks, Total Playlists, Plays Today (placeholder `—`).
4. "Recent Activity" section → points to Audit Log in Analytics.
5. Quick Actions cards: User Management, Track Management, Playlist Management (each links to the respective admin page).
6. Admin API route `GET /api/admin/stats`:
   - Auth: require admin (401/403).
   - `getDBWithDemoData()` → D1 (seeds demo data if tables empty).
   - `COUNT(*)` from `users`, `tracks`, `playlists`.
   - `auditLog(db, { action: "view_stats", targetType: "system" })` — fire-and-forget, never blocks the response.
   - Returns `{ stats: { users, tracks, playlists } }`.

### 3.4 User Management (`/admin/users`)

**UI:** `AdminTable` with columns email, username, displayName, role (AdminBadge admin/user), status (AdminBadge active/suspended), createdAt. Row actions: Promote, Suspend, Delete (each with `confirm()` dialog).

**Flow per action:**
- **Promote:** `PATCH /api/admin/users/[id]` body `{ role: "admin", status: "active" }` → refreshes list (optimistic removal from UI).
- **Suspend:** `PATCH /api/admin/users/[id]` body `{ role: "user", status: "suspended" }`.
- **Delete:** `DELETE /api/admin/users/[id]`.

**API** `app/api/admin/users/[id]/route.ts`:
- `PATCH`: validate `{ role?, status? }` with Zod; `UPDATE users SET role=?, status=? WHERE id=?`; audit log `promote_user` or `suspend_user`.
- `DELETE`: `DELETE FROM users WHERE id=?`; audit log `delete_user`.

**API** `app/api/admin/users/route.ts`:
- `GET`: `SELECT id, email, username, displayName, role, status, createdAt FROM users ORDER BY createdAt DESC` → `{ users }`.

### 3.5 Track Management (`/admin/tracks`)

**UI:** `AdminTable` columns title, artist, album, duration, genre, is_available (AdminBadge active/suspended). Actions: Edit (placeholder console), Unpublish, Delete.

**Flow:**
- **Unpublish:** `PATCH /api/admin/tracks/[id]` body `{ status: "unpublished" }`.
- **Delete:** `DELETE /api/admin/tracks/[id]`.

> Note: `app/api/admin/tracks/route.ts` and `app/api/admin/tracks/[id]/route.ts` do **not exist** in the codebase (the admin Tracks page hits routes that are referenced but not implemented as admin-specific endpoints). The admin Tracks UI is present but the dedicated admin track CRUD routes are missing — this is a gap between the UI and backend.

**API** `app/api/admin/artists/[id]/route.ts` (exists):
- `PATCH`: `UPDATE artists SET name=COALESCE(?,name), biography=COALESCE(?,biography) WHERE id=?`; audit log `update_artist`.
- `DELETE`: `DELETE FROM artists WHERE id=?`; audit log `delete_artist`.

**API** `app/api/admin/artists/route.ts` (exists):
- `GET`: `SELECT * FROM artists ORDER BY name ASC`.

### 3.6 Artists & Albums (`/admin/artists`)

**UI:** `AdminTable` columns name, followers, genre, tracks. Actions: Edit (placeholder), Delete.

**API:** `GET /api/admin/artists` → artists list; `PATCH/DELETE /api/admin/artists/[id]` → update name/biography or delete, with audit log.

### 3.7 Playlist Management (`/admin/playlists`)

**UI:** `AdminTable` columns name, trackCount, isPublic (AdminBadge). Actions: Curate (placeholder), Feature, Delete.

**Flow:**
- **Feature:** `PATCH /api/admin/playlists/[id]` body `{ isPublic: true }` → audit log `feature_playlist`.
- **Unfeature:** implicit via `isPublic: false` → audit log `unfeature_playlist`.
- **Delete:** `DELETE /api/admin/playlists/[id]` → audit log `delete_playlist`.

**API** `app/api/admin/playlists/route.ts`: `GET` → `SELECT * FROM playlists ORDER BY createdAt DESC`.
**API** `app/api/admin/playlists/[id]/route.ts`: `PATCH` updates name/description/is_public; `DELETE` removes playlist. Both audit-logged.

### 3.8 Analytics (`/admin/analytics`)

**UI:** Stat cards (Audit Log Entries, Storage Used `—`, Cache Hit Rate `—`) + `AdminTable` of audit log entries (action, target_type, target_id, created_at).

**API** `GET /api/admin/audit-log`: `SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50` → `{ auditLog }`. Requires admin.

### 3.9 Admin Settings (`/admin/settings`)

**UI:** Placeholder-only (no backend wiring yet):
- Feature Flags: Open Registration, Maintenance Mode, Demo Content Banner (checkboxes → `console.log` placeholder).
- Defaults: Default Crossfade (seconds), Featured Mood (text inputs → `console.log` placeholder).

> Backing table `app_settings` exists in `migrations/0002.sql` but no admin settings API route is implemented yet.

### 3.10 Asset Uploads (`/api/admin/uploads`)

- `POST /api/admin/uploads` (admin only): body `{ filename, contentType }` → generates `key = uploads/<uuid>.<ext>`, returns `{ key, bucket: "little-paradise-assets", uploadUrl: "/api/admin/uploads/<key>" }`. Enables direct R2 PUT from client.
- `PUT /api/admin/uploads/[key]` (admin only): raw body → `BUCKET.put(key, body, { httpMetadata: { contentType: "audio/mpeg" } })` → direct R2 object write. Requires admin.

---

## 4. Connections Between Frontend Website and Admin Dashboard

The two experiences are **not separate apps**; they are two route groups in one Next.js application sharing the same backend. The connections are:

### 4.1 Shared API surface (`app/api/*`)

| Domain | Frontend (listener) uses | Admin uses |
|---|---|---|
| Auth | `POST/GET /api/auth/{register,login,logout,me}` | — (reuses same session cookie) |
| Catalog | `GET /api/tracks`, `/api/tracks/[id]`, `/api/artists`, `/api/albums`, `/api/search` | `GET /api/admin/artists` (admin-specific) |
| Stream | `GET /api/tracks/[id]/stream` (auth required) | — |
| Lyrics | `GET /api/tracks/[id]/lyrics` (public) | `GET/PATCH /api/tracks/[id]/lyrics-offset` (admin only) |
| User library | `GET/POST/DELETE /api/me/favorites[*]` | — |
| History | `GET/POST /api/me/history` | — |
| Preferences | `GET/PATCH /api/me/preferences` | — |
| User playlists | `GET/POST /api/playlists`; `GET/PATCH/DELETE /api/playlists/[id]`; track add/remove/reorder | `GET /api/admin/playlists`; `PATCH/DELETE /api/admin/playlists/[id]` |
| Admin stats | — | `GET /api/admin/stats` |
| Admin users | — | `GET /api/admin/users`; `PATCH/DELETE /api/admin/users/[id]` |
| Admin artists | — | `GET /api/admin/artists`; `PATCH/DELETE /api/admin/artists/[id]` |
| Admin audit log | — | `GET /api/admin/audit-log` |
| Admin uploads | — | `POST/PUT /api/admin/uploads[*]` |

All routes share the same request handlers pattern: `getCurrentUser()` → validate role → `getDBWithDemoData()` → D1 query → `auditLog(...)` → `NextResponse.json(...)`.

### 4.2 Shared authentication & session

- Single cookie: `lp_session` (HttpOnly, secure in prod, sameSite lax, path `/`, 7-day maxAge).
- Both frontend and admin read the same cookie via `getCurrentUser()` (`lib/server/auth-helper.ts`).
- Session storage: D1 `sessions` table in production; in-memory `Map` fallback in local dev (`lib/server/store.ts` + `lib/server/session-store.ts`).
- Admin routes re-verify `role === "admin"` on every request — a regular user who knows an admin URL gets `403`.
- Login rotates the session (delete old token, create new) to prevent session fixation.

### 4.3 Shared database (D1)

One D1 database (`little_paradise_db`) serves both experiences. Schema (`migrations/0001_init.sql` + `0002.sql`):

**Core catalog:** `users`, `artists`, `albums`, `tracks`, `lyrics`
**User library:** `playlists`, `playlist_tracks`, `user_favorites`, `followed_artists`, `listening_history`, `user_preferences`
**Assets:** `user_uploads` (storage_key → R2)
**Sessions:** `sessions`
**Social (prepared):** `follows`, `listening_activity`, `playlist_collaborators`, `listening_rooms`, `room_sessions`, `playlist_reactions`
**Admin:** `app_settings`, `audit_log`

Frontend reads catalog data (mostly from static `demo-data.ts` in current build, but D1 tables exist for production). Admin reads/mutates D1 directly via `getDBWithDemoData()`.

### 4.4 Shared object storage (R2)

- Bucket: `little-paradise-assets`, binding `BUCKET`.
- Admin uploads audio/assets via `PUT /api/admin/uploads/<key>` → `BUCKET.put(key, body)`.
- Streaming serves from R2 via `GET /api/tracks/[id]/stream` → `BUCKET.get(track.audio_source_reference, { type: "stream" })` with HTTP Range support (206 partial content) for seek/scrobble.
- Frontend demo audio currently also lives in `public/audio/` for offline/local playback.

### 4.5 Shared client state (Zustand)

- `libraryStore` holds `user`, `isAuthenticated`, `favorites`, `playlists`, `history`, `preferences` — persisted to `localStorage` (`little-paradise-library`).
- `playerStore` holds playback state — persisted to `localStorage` (`little-paradise-player`).
- `AppShell` derives `isAdmin = isAdminUser(user)` from `libraryStore.user` to show/hide the Admin nav link.
- `AdminGuard` reads the same `user` to gate admin pages.
- So a user who logs in on the frontend sees their session carry into the admin dashboard if they have the admin role — same cookie, same store, same identity.

### 4.6 Request lifecycle (middleware → route handler)

Every request to the app passes through `lib/server/middleware.ts` `processRequest`:

1. **Public-path short-circuit:** if path is public (`/`, `/explore`, `/search`, `/auth/*`, `/api/auth/*`, `/api/tracks`, `/api/artists`, `/api/albums`, `/api/search`, `/_next/*`, `/favicon.ico`) → allow immediately.
2. **Session resolution:** read `lp_session` cookie → `getSessionUser(db, token)` → resolve user (D1 or in-memory).
3. **Auth gating:** if path is auth-required or admin and no user → `401` (API) or redirect to `/auth/login?next=...` (page).
4. **Admin gating:** if path is `/admin/*` and `user.role !== "admin"` → `403 FORBIDDEN`.
5. **CSRF:** on mutating methods (POST/PUT/PATCH/DELETE), require `Origin` host === request `Host`, else `403 CSRF_ERROR`.
6. **Allow:** route handler executes (Next.js Route Handler in `app/api/*`).

### 4.7 Data-flow summary (text diagram)

```
Browser (listener)                          Browser (admin)
       │                                          │
       │  lp_session cookie (shared)              │  lp_session cookie (shared)
       └────────────────────┬─────────────────────┘
                            │
                    Next.js Middleware
                    (public check → session → auth/admin → CSRF → allow)
                            │
                            ▼
                    Next.js Route Handlers  (app/api/*)
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         D1 Database      R2 Bucket     (static demo-data.ts)
    (users, tracks,        (audio files)  (frontend catalog fallback)
     playlists, sessions,   │
     audit_log, …)          │
              └─────────────┴─────────────┘
                            │
                    Cloudflare Workers (OpenNext adapter)
```

**Cross-experience actions:**
- Listener registers/logs in → session cookie set → can access `/library`, `/playlists`, `/settings` → admin link appears only if `role === "admin"`.
- Admin clicks "Admin" in sidebar → `/admin/dashboard` → `AdminGuard` confirms admin role → fetches `/api/admin/stats` (server-verified admin) → manages users/tracks/artists/playlists via `/api/admin/*`.
- Admin uploads a track → `POST /api/admin/uploads` gets an upload key/URL → client `PUT`s the file to R2 → track becomes streamable via `/api/tracks/[id]/stream`.
- Listener plays a track → `AudioEngine` streams from R2 → `onEnded` writes to `listening_history` (D1) → history shows in `/recent` and `/library`.

---

## 5. Key Gaps / Notes for Future Work

1. **Admin Tracks CRUD routes missing:** `app/api/admin/tracks/route.ts` and `app/api/admin/tracks/[id]/route.ts` are referenced by `/admin/tracks` UI but not implemented. The admin Artists/Playlists routes exist; Tracks does not.
2. **Admin Settings is placeholder-only:** `app_settings` table exists in migrations but no `GET/PATCH /api/admin/settings` route; checkboxes just `console.log`.
3. **Frontend catalog is static demo data:** `app/api/tracks`, `/api/search`, etc. read from `lib/demo-data.ts` rather than D1 `tracks` table. Production content would need migration to D1-backed routes.
4. **AudioEngine uses public/audio demo files:** R2 streaming (`/api/tracks/[id]/stream`) is implemented but wired to `track.audio_source_reference`, which demo tracks don't populate (they use `audioUrl` → `/audio/*.mp3`).
5. **Social features prepared but not wired:** `follows`, `listening_activity`, `playlist_collaborators`, `listening_rooms`, `playlist_reactions` tables exist in `0002.sql`; types exist in `lib/types.ts`; but no API routes or UI consume them yet.
6. **AdminGuard is client-side only:** It prevents flashing admin content to non-admins, but real security is middleware + per-route `role === "admin"` checks in every admin API handler.

---

## 6. Commands & Deployment

| Command | Purpose |
|---|---|
| `npm run dev` | Local Next.js dev server (in-memory store; data resets on restart) |
| `npm run build` | Production Next.js build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run cf:build` | OpenNext Cloudflare build (`.open-next/`) |
| `npm run cf:preview` | Preview on Cloudflare Workers runtime |
| `npm run cf:deploy` | `wrangler deploy` to Cloudflare |
| `wrangler d1 create little_paradise_db` | Create D1 DB |
| `wrangler r2 bucket create little-paradise-assets` | Create R2 bucket |
| `wrangler d1 migrations apply little_paradise_db` | Apply `migrations/` to D1 |
| `wrangler secret put JWT_SECRET` | Set JWT secret (not committed) |
