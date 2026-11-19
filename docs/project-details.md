# Little Paradise — Project Details

**Single-source documentation for the Little Paradise music streaming web app.**

> A premium music-listening environment with synchronized lyrics, built on Next.js 15 and Cloudflare.

> Your little world of music — listen, discover, and feel every lyric in sync.

---

# 1. Project Overview

Little Paradise is a full-stack music streaming web application with a "Liquid Glass" UI. It combines a persistent audio player, synchronized LRC lyrics, mood-based discovery, playlists, favorites, listening history, and user accounts into one cohesive experience.

**Product tagline:** "Your little world of music — listen, discover, and feel every lyric in sync."

**Status:** Polished demo / pre-production (demo content labeled as such; intended to be replaced with licensed content)

**License:** Private project. All rights reserved. (No license file present.)

**Repository:** `little-paradise` — Next.js 15 App Router + Cloudflare Workers (OpenNext adapter)

---

# 2. Feature Inventory

| Area | Features |
|------|----------|
| **Player** | Persistent queue, shuffle, repeat (off/all/one), seek, volume, mute, single shared `Audio` instance (`AudioEngine`) surviving route changes, Media Session API (lock screen / headphones / media keys), resume state via `localStorage` |
| **Lyrics** | Synchronized LRC lyrics, auto-scroll with manual-scroll pause/resume, click-to-seek, adjustable sync offset, compact/immersive modes |
| **Discovery** | Home (greeting, featured, quick access shelves), Explore (mood-based filtering), Search (tracks/artists/albums/playlists), Library |
| **Library & Social** | Playlists (create, edit, reorder, add/remove tracks), Favorites, Recently Played (last 200) |
| **Catalog browsing** | Artists, albums, tracks, genres, moods |
| **User accounts** | Register/login/logout, profile, settings, preferences (theme, accent, volume, autoplay, crossfade, lyrics options, privacy) |
| **Design** | Liquid Glass design system — translucent panels, gradients, backdrop blur, custom theme tokens, dark mode default |
| **Backend** | Cloudflare-native: D1 (SQL), R2 (object storage), KV (key-value), OpenNext Cloudflare adapter |

---

# 3. Tech Stack

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Framework | Next.js 15 (App Router) | React Server Components + client components |
| React | React 19 | `reactStrictMode: true` |
| Language | TypeScript | `tsc --noEmit` |
| Styling | Tailwind CSS 3.4 | Custom design tokens in `globals.css` + `tailwind.config.ts` |
| Animation | Framer Motion | Route/page transitions, spring presets |
| Icons | lucide-react | |
| State | Zustand | `playerStore`, `libraryStore`, `toastStore` with `persist` middleware (localStorage) |
| Validation | Zod | `lib/schemas.ts` |
| Auth | bcryptjs + HttpOnly cookie | `lp_session`, 7-day TTL |
| Audio | HTML5 `<audio>` | Single `AudioEngine` instance |
| Backend / Runtime | Cloudflare Workers (OpenNext) | `open-nextjs-cloudflare` adapter |
| Database | Cloudflare D1 | Binding `DB`, migrations in `migrations/` |
| Object Storage | Cloudflare R2 | Binding `BUCKET`, bucket `little-paradise-assets` |
| Key-Value | Cloudflare KV | Binding `KV` |
| Build / Deploy | Wrangler | `wrangler deploy`, `opennextjs-cloudflare build/preview` |
| Testing | Vitest | Unit tests for `parseLrc` and `playerStore` |
| Linting | ESLint | `eslint-config-next` |
| Fonts | Inter + Manrope | Loaded via Google Fonts preconnect |

---

# 4. Architecture

## 4.1 High-Level Architecture

```
Browser (Next.js App Router)
├── Client Components (pages + UI)
│   ├── AppShell (sidebar, mobile nav, persistent player bar)
│   ├── AudioEngine (single shared HTML5 Audio instance)
│   ├── LyricsView (synced LRC display)
│   └── Zustand stores (player, library, toast)
└── API Route Handlers (app/api/*) → run on Cloudflare Workers
    └── TanStack Query (server-state cache)

Cloudflare Workers (OpenNext adapter)
├── D1 (SQL) — users, artists, albums, tracks, lyrics, playlists, …
├── R2 — audio/artwork assets
└── KV — caching / sessions (planned)
```

## 4.2 Key Architectural Decisions

- **Persistent player:** A single `Audio` instance lives in `AudioEngine` (mounted in root `layout.tsx`) and survives route changes. Playback state is owned by `playerStore` (Zustand + `localStorage` persist).
- **Dev/prod data parity:** `lib/server/store.ts` uses D1 when `getDB()` returns a binding (Cloudflare Workers), falling back to in-memory `Map` stores in local dev. Behavior can diverge — flagged as a gap.
- **Auth:** Stateless session token in an HttpOnly `lp_session` cookie; `auth-helper.ts` reads the cookie via Next.js `cookies()` and resolves the user through `store.ts`.
- **Images:** `next.config.mjs` sets `images: { unoptimized: true }` (no Next.js image optimization), suitable for Cloudflare Workers.
- **Demo content:** Audio, LRC lyrics, and seed data are bundled in the repo (`public/audio/`, `lib/lyrics/parseLrc.ts`, `lib/demo-data.ts`) and clearly labeled as demo.

## 4.3 State Management

Three Zustand stores in `lib/store/`:

| Store | File | Purpose | Persisted? |
|-------|------|---------|------------|
| `playerStore` | `playerStore.ts` | Current track, play/pause, queue, queue index, time, duration, volume, muted, shuffle, repeat mode, loading/error | Yes (`little-paradise-player`) |
| `libraryStore` | `libraryStore.ts` | User/session, favorites, followed artists, saved albums, playlists, history, preferences, recent searches | Yes (`little-paradise-library`) |
| `toastStore` | `toastStore.ts` | Global toasts with optional undo and auto-dismiss (4s default) | No |

## 4.4 AudioEngine (`components/player/AudioEngine.tsx`)

- Creates `new Audio()` once on mount, stores it on `window.__lpAudio`.
- Syncs `src` from `currentTrack.audioUrl` when the track changes.
- Play/pause driven by `isPlaying` from `playerStore`.
- Volume/muted synced to the audio element.
- Media Session API: metadata (title/artist/album) + action handlers for play, pause, previous track, next track, seek-to.
- Event handlers: `timeupdate`, `loadedmetadata`, `canplay`, `ended`, `error`, `waiting`, `playing`.
- On `ended`: handles repeat "one" (replay), records listening history via `addToHistory`, then advances to next track via `next()`.
- On `error`: one retry (reload + play), then skip to next track with error state.
- `seekAudio(time)` helper sets `audio.currentTime` via the global ref.

---

# 5. Project Structure

```
little-paradise/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout: AudioEngine + AppShell, metadata, fonts
│   ├── page.tsx                  # Home (greeting, featured, shelves, moods, artists)
│   ├── globals.css               # Design tokens + glass utilities + focus rings
│   ├── fonts/                    # (font assets)
│   ├── favicon.ico
│   ├── explore/page.tsx          # Explore: mood filter, trending, new releases, artists, genres, moods
│   ├── search/page.tsx           # Client-side search over demo data + recent searches
│   ├── library/page.tsx          # Library sections + recently played
│   ├── favorites/page.tsx        # Favorites UI
│   ├── lyrics/page.tsx           # Lyrics page: compact/immersive toggle, LyricsView
│   ├── player/page.tsx           # Full-screen immersive player (artwork ↔ lyrics toggle)
│   ├── profile/page.tsx          # Profile page
│   ├── settings/page.tsx         # Settings: appearance, playback, lyrics, privacy, account
│   ├── playlists/page.tsx        # Playlists list + create
│   ├── playlists/[id]/page.tsx   # Playlist detail
│   ├── artists/[id]/page.tsx     # Artist detail
│   └── api/                      # API route handlers (Cloudflare Workers)
│       ├── auth/
│       │   ├── register/route.ts   (POST, rate-limited 5/min per IP)
│       │   ├── login/route.ts      (POST, rate-limited 10/min per IP)
│       │   ├── logout/route.ts     (POST)
│       │   └── me/route.ts         (GET current user)
│       ├── tracks/route.ts         (GET list / single by ?id)
│       ├── tracks/[id]/route.ts    (GET single track)
│       ├── artists/route.ts        (GET list / single by ?id)
│       ├── albums/route.ts         (GET list / single by ?id, includes tracks)
│       ├── search/route.ts         (GET q= → tracks, artists, albums, playlists)
│       ├── playlists/route.ts      (GET list, POST create — auth required)
│       ├── playlists/[id]/route.ts (GET, PATCH, DELETE — auth required)
│       ├── me/favorites/route.ts   (GET — auth required)
│       ├── me/history/route.ts     (GET, POST — auth required)
│       └── me/preferences/route.ts (GET, PATCH — auth required)
├── components/
│   ├── layout/
│   │   └── AppShell.tsx          # Desktop sidebar, mobile top bar + drawer, persistent player bar, bottom mobile nav, QueueDrawer, ToastHost
│   ├── player/
│   │   ├── AudioEngine.tsx       # Shared HTML5 Audio instance + Media Session API
│   │   └── QueueDrawer.tsx       # Queue drawer: now playing / next up / previously played
│   ├── lyrics/
│   │   └── LyricsView.tsx        # Synced LRC view: auto-scroll, click-to-seek, active-line styling, compact mode
│   └── ui/
│       ├── Artwork.tsx           # Gradient artwork placeholder (spinning option)
│       ├── Glass.tsx             # GlassPanel component (glass / strong)
│       ├── Skeleton.tsx          # Shimmer skeleton
│       └── ToastHost.tsx         # Global toast host with undo support
├── lib/
│   ├── types.ts                  # Shared TS types: Track, Artist, Album, Playlist, User, Lyrics, Preferences, PlayerState, RepeatMode
│   ├── demo-data.ts              # Demo catalog: ARTISTS, ALBUMS, TRACKS (6), PLAYLISTS (3), MOODS (10), GENRES (8)
│   ├── schemas.ts                # Zod schemas: register, login, playlist create/patch, preferences, history, favorites, reorder, playlist track
│   ├── utils.ts                  # seekAudio, formatTime, cn
│   ├── server/
│   │   ├── db.ts                 # getDB(): returns D1 binding on Workers, null in dev
│   │   ├── store.ts              # Auth + data store: D1 path with in-memory fallback (users, sessions, playlists, favorites, history, prefs)
│   │   ├── auth-helper.ts        # getCurrentUser, setSessionCookie, clearSessionCookie, re-exports create/deleteSession
│   │   ├── api.ts                # jsonError, zodError, withErrorHandling helpers
│   │   └── rate-limit.ts         # In-memory fixed-window rate limiter (per IP)
│   ├── store/
│   │   ├── playerStore.ts        # Zustand player state + persist
│   │   ├── libraryStore.ts       # Zustand library state + persist
│   │   └── toastStore.ts         # Zustand toast state
│   └── lyrics/
│       └── parseLrc.ts           # LRC parser (time + offset, sorting, blank-line skip), findActiveLineIndex, DEMO_LYRICS (6 tracks)
├── migrations/
│   └── 0001_init.sql             # D1 schema: 14 tables + indexes
├── public/
│   └── audio/                    # Demo MP3 files (track1.mp3 … track6.mp3, SoundHelix)
├── public/audio/                   # Demo MP3 tracks (track1.mp3 … track6.mp3)
├── public/
├── tests/
│   ├── parseLrc.test.ts          # Vitest: LRC parsing, offset, sorting, blank lines, findActiveLineIndex
│   └── playerStore.test.ts       # Vitest: playTrack, next/prev, removeFromQueue
├── docs/
│   ├── project-details.md        # This file
│   └── superpowers/
│       ├── plans/                # Implementation plans
│       └── specs/                # Design specifications
├── Little Paradise Improvement Plan.md   # Separate roadmap doc (UI/UX, player, backend, security, testing, roadmap)
├── package.json                  # Scripts: dev/build/start/lint/typecheck/test/cf:build/cf:preview/cf:deploy
├── next.config.mjs               # unoptimized images, reactStrictMode, eslint/ts build flags
├── tailwind.config.ts            # Colors, fonts, backdrop blur, shadows, glass-gradient
├── wrangler.jsonc                # Cloudflare bindings: D1 DB, R2 BUCKET, KV, vars (JWT_ISSUER, TOKEN_TTL_SECONDS)
├── open-next.config.ts           # OpenNext Cloudflare adapter config
├── vitest.config.ts              # Vitest config
├── tsconfig.json                 # TypeScript config
├── postcss.config.mjs            # PostCSS config
├── .eslintrc.json                # ESLint config
└── next-env.d.ts                 # Next.js env types
```

---

# 6. Data Model (D1 — `migrations/0001_init.sql`)

## Tables (14 total)

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `users` | id PK, email UQ, password_hash, username, display_name, avatar_url, created_at, updated_at | |
| `artists` | id PK, name, biography, image_url, created_at | |
| `albums` | id PK, artist_id FK→artists, title, artwork_url, release_date, created_at | |
| `tracks` | id PK, album_id FK, artist_id FK, title, duration, audio_source_type, audio_source_reference, artwork_url, track_number, genre, is_available, created_at | |
| `lyrics` | id PK, track_id FK→tracks (cascade), format, language, lyrics_content, synchronization_offset, source_provider, license_reference, created_at, updated_at | |
| `playlists` | id PK, user_id FK→users (cascade), name, description, artwork_url, is_public, created_at, updated_at | |
| `playlist_tracks` | id PK, playlist_id FK (cascade), track_id FK (cascade), position, added_at, UQ(playlist_id, track_id) | |
| `user_favorites` | id PK, user_id FK (cascade), track_id FK (cascade), created_at, UQ(user_id, track_id) | |
| `followed_artists` | id PK, user_id FK (cascade), artist_id FK (cascade), created_at, UQ(user_id, artist_id) | |
| `listening_history` | id PK, user_id FK (cascade), track_id FK (cascade), played_at, listened_duration | |
| `user_preferences` | user_id PK FK→users (cascade), preferences_json, updated_at | |
| `user_uploads` | id PK, user_id FK (cascade), track_id FK (set null), storage_key, file_size, mime_type, created_at | |
| `sessions` | token PK, user_id FK→users (cascade), expires_at, created_at | |

## Indexes

- `idx_tracks_artist` ON tracks(artist_id)
- `idx_tracks_album` ON tracks(album_id)
- `idx_playlist_tracks_playlist` ON playlist_tracks(playlist_id)
- `idx_favorites_user` ON user_favorites(user_id)
- `idx_history_user` ON listening_history(user_id)
- `idx_history_played` ON listening_history(played_at)

## Client-Side Types (`lib/types.ts`)

Types mirror the D1 schema:

| Type | Key Fields |
|------|------------|
| `Track` | id, title, artist, album, duration, audioUrl, artworkSeed, genre, trackNumber?, artistId?, albumId? |
| `Artist` | id, name, bio, followers, seed |
| `Album` | id, title, artistId, artist, releaseDate, trackIds, seed |
| `Playlist` | id, name, description, trackIds, isPublic, createdAt, updatedAt, seed |
| `User` | id, email, username, displayName, avatarSeed, createdAt, role?, status? |
| `Lyrics` | trackId, format ("lrc"), language, content, offset, lines |
| `LyricsLine` | time, text, words?: { time, word }[] |
| `Preferences` | theme, accent, defaultVolume, autoplay, crossfade, rememberPosition, lyricsAutoScroll, lyricsFontSize, lyricsOffset, lyricsMode, privateProfile, privatePlaylists, reducedTransparency, favoriteGenres, favoriteMoods, sleepTimerMinutes, audioQuality, crossfadeLength |
| `PlayerState` | currentTrack, isPlaying, currentTime, duration, volume, muted, shuffle, repeatMode, queue, queueIndex, isLoading, error, crossfadeLength, sleepTimerActive, sleepTimerRemaining, audioQuality |
| `RepeatMode` | "off" \| "one" \| "all" |
| `UserRole` | "user" \| "admin" |
| `UserStatus` | "active" \| "suspended" |

---

# 7. API Routes

All route handlers live in `app/api/` and run on Cloudflare Workers. Error shape: `{ error: { code, message } }`.

## Auth

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Register user, create session, set `lp_session` cookie | No (rate-limited 5/min/IP) |
| POST | `/api/auth/login` | Verify credentials, rotate session, set cookie | No (rate-limited 10/min/IP) |
| POST | `/api/auth/logout` | Delete session + clear cookie | No |
| GET | `/api/auth/me` | Get current user (or `{ user: null }`) | No |

## Catalog

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/tracks` | List tracks (optional `?id=` for single) | No |
| GET | `/api/tracks/[id]` | Single track | No |
| GET | `/api/artists` | List artists (optional `?id=`) | No |
| GET | `/api/albums` | List albums (optional `?id=`, includes tracks) | No |

## Search

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/search?q=...` | Search tracks/artists/albums/playlists (demo data) | No |

## User (auth required — `lp_session` cookie)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/me/favorites` | List favorited track IDs | Yes |
| POST/DELETE | `/api/me/favorites/[trackId]` | Toggle favorite | Yes |
| GET/POST | `/api/me/history` | List / add listening history entry | Yes |
| GET/PATCH | `/api/me/preferences` | Get / patch user preferences | Yes |
| GET/POST | `/api/playlists` | List user playlists / create playlist | Yes |
| GET/PATCH/DELETE | `/api/playlists/[id]` | Get / update / delete a playlist | Yes |
| POST/DELETE | `/api/playlists/[id]/tracks` | Add / remove track in playlist | Yes |
| PATCH | `/api/playlists/[id]/reorder` | Reorder playlist tracks | Yes |

## Shared Helpers

- `lib/server/api.ts`: `jsonError`, `zodError`, `withErrorHandling`
- `lib/server/rate-limit.ts`: `checkRateLimit(key, limit, windowMs)`, `rateLimitKey(prefix, id)` — in-memory fixed window

---

# 8. Frontend Routes & Pages

| Route | Page | Summary |
|-------|------|---------|
| `/` | `page.tsx` | Home: time-of-day greeting, featured track, quick-access recent tracks, Made For You shelves, featured playlists, moods, popular artists |
| `/explore` | `explore/page.tsx` | Explore: mood filter (`?mood=`), trending tracks, new releases, popular artists, genres, mood collections |
| `/search` | `search/page.tsx` | Search: client-side filtered results grouped by type, recent searches, browse categories |
| `/library` | `library/page.tsx` | Library: liked songs, playlists, followed artists, saved albums, recently played |
| `/favorites` | `favorites/page.tsx` | Favorites |
| `/recent` | `recent/page.tsx` | Recently played |
| `/lyrics` | `lyrics/page.tsx` | Lyrics: compact/immersive toggle, track selector when nothing playing, LyricsView + artwork |
| `/player` | `player/page.tsx` | Full-screen immersive player: artwork ↔ lyrics toggle, seek bar, playback controls, volume, favorite, repeat/shuffle |
| `/playlists` | `playlists/page.tsx` | Playlists list + create new |
| `/playlists/[id]` | `playlists/[id]/page.tsx` | Playlist detail |
| `/artists/[id]` | `artists/[id]/page.tsx` | Artist detail |
| `/profile` | `profile/page.tsx` | Profile |
| `/settings` | `settings/page.tsx` | Settings: appearance, playback, lyrics, privacy, account |

## Layout (`components/layout/AppShell.tsx`)

- Desktop: fixed left sidebar (w-64) with logo, nav (Home/Explore/Search/Library/Playlists/Favorites/Recents/Lyrics), Profile/Settings links; persistent bottom player bar; main content area.
- Mobile: fixed top bar (menu + search), slide-out nav drawer, bottom tab bar.
- Persistent player bar shows current track artwork, title/artist, favorite heart, shuffle/prev/play/next/repeat controls, seek bar with times, volume, queue, fullscreen link.
- `QueueDrawer` (right-side drawer) and `ToastHost` (bottom center) are rendered in the shell.

---

# 9. Design System ("Liquid Glass")

## Colors (`tailwind.config.ts` + `globals.css`)

| Token | Value | Use |
|-------|-------|-----|
| `midnight` | `#090B12` | Background |
| `midnight-2` | `#111522` | Surface |
| `glass` | `rgba(255,255,255,0.065)` | Glass panels |
| `accent` | `#A78BFA` | Primary actions / highlights |
| `accent2` | `#8BC5FF` | Secondary accent |
| `highlight` | `#C4B5FD` | Text highlight |
| `ink` | `#F8FAFC` | Body text |
| `muted` | `#9299AB` | Muted text |

## Glass surfaces (`globals.css`)

| Class | Blur | Border | Shadow | Radius |
|-------|------|--------|--------|--------|
| `glass` | blur(28px) saturate(160%) | `rgba(255,255,255,0.12)` | inset highlight + drop shadow | 12px |
| `glass-strong` | blur(40px) saturate(180%) | `rgba(255,255,255,0.16)` | stronger shadow | 12px |
| `glass-subtle` | blur(12px) | `--lp-glass-border-subtle` | `--lp-shadow-glass` | 12px |
| `glass-raised` | blur(28px) | `--lp-glass-border-raised` | `--lp-shadow-raised` | 20px |
| `glass-overlay` | blur(40px) | `--lp-glass-border-overlay` | `--lp-shadow-raised` | 28px |

## CSS Design Tokens (`globals.css :root`)

- `--lp-glass-bg-subtle/raised/overlay`, `--lp-glass-border-subtle/raised/overlay`
- `--lp-blur-sm/md/lg` (12/28/40px), `--lp-radius-sm/md/lg/xl` (8/12/20/28px)
- `--lp-shadow-glass`, `--lp-shadow-raised`, `--lp-focus-ring` (2px accent + 4px glow)
- `--lp-btn-primary: #6A4AF0`
- Reduced transparency replaces glass with near-solid surfaces (`rgba(20,24,40,0.92–0.98)`)

## Typography

- **Sans:** `Inter` (weights 300–700) — UI text
- **Display:** `Manrope` (weights 400–800) — headings
- Loaded via Google Fonts preconnect in `layout.tsx`

## Other

- `focus-visible` ring uses `--lp-focus-ring` (never removes focus indication)
- `prefers-reduced-motion` disables backdrop filter and all animations/transitions
- Scrollbars: thin, muted thumb
- `.skeleton` shimmer animation for loading states

---

# 10. Lyrics System (`lib/lyrics/parseLrc.ts`)

## Parser

- `parseLrc(content, offset = 0)`: parses `[mm:ss.xx] text` lines, applies offset (seconds), handles fractional milliseconds (padded to 3 digits), skips blank text, sorts by time. Returns `LrcLine[]`.
- `findActiveLineIndex(lines, currentTime)`: linear scan returning index of latest line with `time <= currentTime`, or `-1`.
- `DEMO_LYRICS`: hard-coded LRC strings for tracks `t1`–`t6`, labeled as demo.

## LyricsView Component

- Loads `DEMO_LYRICS[currentTrack.id]`, computes active index via `findActiveLineIndex`.
- Auto-scrolls active line to ~1/3 from top (paused on manual scroll, "Jump to current line" pill, resumes after 4s).
- Supports compact/immersive modes.
- Supports word-level karaoke highlighting when `words` array present on lines.
- Displays translation line under each lyric line when available.
- Active line styled with gradient text and larger scale.

### LRC Format
```
[mm:ss.xx] text
```
Optional inline word tags: `<mm:ss.xx>word`

### Demo Lyrics
Pre-loaded for tracks `t1`–`t6`, clearly labeled as demo content.

---

# 11. Authentication & Security

## Cookie
- Name: `lp_session`
- Attributes: HttpOnly, `secure` in production, `sameSite: lax`, `path: /`, `maxAge: 7 days`
- Token: random string stored in memory (`sessions` Map) in dev; D1 `sessions` table in prod schema.

## Password Hashing
- bcryptjs (cost 10)

## Rate Limiting
- In-memory fixed-window per IP on register (5/min) and login (10/min).
- `lib/server/rate-limit.ts`: `checkRateLimit(key, limit, windowMs)`, `rateLimitKey(prefix, id)`.

## Security Notes / Gaps
- `JWT_SECRET` not yet moved to Wrangler secrets (only `JWT_ISSUER`/`TOKEN_TTL_SECONDS` are in `wrangler.jsonc` vars).
- No CSRF protection on cookie-authenticated mutating routes.
- No Content Security Policy / security headers.
- bcryptjs may be slow under Workers CPU limits.

---

# 12. Configuration & Deployment

## `wrangler.jsonc`

```jsonc
{
  "main": ".open-next/worker.js",
  "name": "little-paradise",
  "compatibility_date": "2025-03-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "d1_databases": [
    { "binding": "DB", "database_name": "little_paradise_db", "database_id": "00000000-0000-0000-0000-000000000000", "migrations_dir": "migrations" }
  ],
  "r2_buckets": [
    { "binding": "BUCKET", "bucket_name": "little-paradise-assets" }
  ],
  "kv_namespaces": [
    { "binding": "KV", "id": "00000000000000000000000000000000" }
  ],
  "vars": {
    "JWT_ISSUER": "little-paradise",
    "TOKEN_TTL_SECONDS": "604800"
  }
}
```

## Deploy Steps (`README.md`)

1. `wrangler d1 create little_paradise_db`
2. `wrangler r2 bucket create little-paradise-assets`
3. Update `database_id` in `wrangler.jsonc`
4. `wrangler secret put JWT_SECRET`
5. `npm run cf:build`
6. `npm run cf:deploy`
7. `wrangler d1 migrations apply little_paradise_db`

## `next.config.mjs`

- `eslint.ignoreDuringBuilds: true`, `typescript.ignoreBuildErrors: false`
- `reactStrictMode: true`, `poweredByHeader: false`
- `images: { unoptimized: true }`

---

# 13. Development Workflow

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run dev` | `next dev` | Local dev server (Next.js) |
| `npm run build` | `next build` | Production build |
| `npm run start` | `next start` | Start production server |
| `npm run lint` | `next lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` | TypeScript typecheck |
| `npm test` | `vitest run` | Unit tests |
| `npm run test:watch` | `vitest` | Watch-mode tests |
| `npm run cf:build` | `opennextjs-cloudflare build` | Cloudflare Workers build |
| `npm run cf:preview` | `opennextjs-cloudflare preview` | Preview on Workers runtime |
| `npm run cf:deploy` | `wrangler deploy` | Deploy to Cloudflare |

### Dev Notes
- Local dev uses in-memory store (`lib/server/store.ts`); data resets on server restart.
- Auth cookie `secure` only in production (`NODE_ENV` check).
- Images unoptimized (no Next.js image optimization on Workers).

---

# 14. Testing

- **Framework:** Vitest v2
- **Files:** `tests/parseLrc.test.ts` (LRC parser), `tests/playerStore.test.ts` (player store: playTrack, next/prev, removeFromQueue)
- **Config:** `vitest.config.ts`
- **No end-to-end or visual regression tests yet** (flagged in Improvement Plan).

---

# 15. Demo Content

| Item | Source | Count |
|------|--------|-------|
| Audio tracks | `public/audio/track1–6.mp3` (SoundHelix, royalty-free) | 6 |
| LRC lyrics | `lib/lyrics/parseLrc.ts` `DEMO_LYRICS` (labeled demo) | 6 tracks |
| Tracks | `lib/demo-data.ts` `TRACKS` | 6 |
| Artists | `lib/demo-data.ts` `ARTISTS` | 5 (Aurora Vale, Nocturne Theory, Solstice, Echo Harbor, Mira Cloud) |
| Albums | `lib/demo-data.ts` `ALBUMS` | 4 |
| Playlists | `lib/demo-data.ts` `PLAYLISTS` | 3 |
| Moods | `lib/demo-data.ts` `MOODS` | 10 |
| Genres | `lib/demo-data.ts` `GENRES` | 8 |

Artwork is generated client-side as CSS gradients keyed by `artworkSeed`/`seed` (no image files). Replace with licensed content for production use.

---

# 16. Related Documents

| Document | Location | Purpose |
|----------|----------|---------|
| README.md | `README.md` | User-facing overview, features, getting started, deploy, API routes, demo content, notes |
| Improvement Plan | `Little Paradise Improvement Plan.md` | Detailed roadmap (UI/UX, player, backend, security, testing, roadmap) |
| Project Details | `docs/project-details.md` | This file — single consolidated project reference |
| Specs/Plans | `docs/superpowers/specs/` and `docs/superpowers/plans/` | AI-agent specs and implementation plans |

---

# 17. Known Limitations & Planned Gaps

(from README + Improvement Plan)

| Area | Gap |
|------|-----|
| Content | Demo-only content (SoundHelix audio, demo LRC, hard-coded seed data) |
| Dev/prod parity | Dev uses in-memory store; production uses D1 — behavior can diverge |
| Images | Unoptimized; no image pipeline |
| Tests | Only two Vitest files; no CI, no E2E, no visual regression |
| Security | `JWT_SECRET` not in Wrangler secrets; no CSRF; no security headers; bcryptjs cost unbenchmarked on Workers |
| API | Favorites toggle / playlist track add/remove / reorder route files missing; no pagination, no FTS, no KV caching |
| PWA | Not implemented |
| Offline | Not supported |

---

*Generated from the Little Paradise codebase (Next.js 15 + Cloudflare). This file is intended to be the single consolidated project-detail document; keep it in sync as the project evolves.*