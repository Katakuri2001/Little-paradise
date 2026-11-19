# Little Paradise

A premium music-listening environment with synchronized lyrics, built on Next.js 15 and Cloudflare.

> Your little world of music — listen, discover, and feel every lyric in sync.

## Overview

Little Paradise is a full-stack music streaming web app with a "Liquid Glass" UI. It ships a persistent audio player, synchronized LRC lyrics, mood-based discovery, playlists, favorites, listening history, and user accounts. The frontend runs on Next.js (App Router); in production it deploys to Cloudflare Workers via the OpenNext Cloudflare adapter, backed by Cloudflare D1 (database), R2 (assets), and KV.

## Features

- **Liquid Glass design system** — translucent panels, gradients, and backdrop blur (Tailwind + custom theme).
- **Persistent audio player** — queue, shuffle, repeat (off/all/one), seek, volume, mute, with a single shared `Audio` instance (`AudioEngine`) that survives route changes.
- **Synchronized LRC lyrics** — auto-scroll, click-to-seek, adjustable offset, compact/immersive modes.
- **Full-screen immersive player** with lyrics mode.
- **Discovery** — Home, Explore (mood-based), Search (tracks/artists/albums/playlists), Library.
- **Library & social** — Playlists (create, edit, reorder, add/remove tracks), Favorites, Recently Played.
- **Catalog browsing** — artists, albums, tracks, genres, moods.
- **User accounts** — register/login/logout, profile, settings, preferences (theme, accent, volume, autoplay, crossfade, lyrics options, privacy).
- **Cloudflare-native** — D1/R2/KV bindings; OpenNext Cloudflare build & deploy.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 3.4, custom design tokens |
| Animation | Framer Motion |
| State | Zustand (player + library stores), TanStack Query |
| Icons | lucide-react |
| Auth | bcryptjs + HttpOnly `lp_session` cookie (7-day TTL) |
| Backend/DB | Cloudflare Workers (OpenNext), D1, R2, KV |
| Audio | HTML5 `<audio>` via a single `AudioEngine` |

## Project Structure

```
app/
  layout.tsx            # Root layout, AudioEngine + AppShell
  page.tsx              # Home
  explore/ search/ library/ lyrics/ player/ profile/ settings/
  artists/[id]/ albums? /playlists/ /favorites/ /recent/
  auth/login/ auth/register/
  api/                  # Route handlers (auth, tracks, playlists, favorites, history, preferences, lyrics, search, albums, artists)
components/
  layout/AppShell.tsx   # Sidebar, mobile nav, persistent player bar
  player/               # AudioEngine, QueueDrawer
  lyrics/LyricsView.tsx
  ui/                   # Artwork, Glass
lib/
  types.ts              # Shared TS types
  demo-data.ts          # Demo tracks/artists/albums/playlists/moods
  utils.ts
  lyrics/parseLrc.ts     # LRC parser + demo lyrics
  store/                # playerStore, libraryStore (Zustand)
  server/               # auth-helper, in-memory store (dev)
migrations/             # D1 SQL migrations (0001_init.sql)
public/audio/           # Demo MP3 tracks (SoundHelix, royalty-free)
wrangler.jsonc          # Cloudflare bindings (D1, R2, KV)
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- (For Cloudflare deploy) Wrangler CLI (included as a dependency)

### Install & run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

> In local dev, auth uses an in-memory store (see `lib/server/store.ts`). Data resets on server restart.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Local dev server (Next.js) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run Vitest unit tests |
| `npm run cf:build` | OpenNext Cloudflare build |
| `npm run cf:preview` | Preview on Workers runtime |
| `npm run cf:deploy` | Deploy to Cloudflare |

## Configuration

Cloudflare bindings are declared in `wrangler.jsonc`:

- **D1** — `DB` → database `little_paradise_db` (migrations in `migrations/`)
- **R2** — `BUCKET` → bucket `little-paradise-assets`
- **KV** — `KV`
- **Vars** — `JWT_SECRET`, `JWT_ISSUER`, `TOKEN_TTL_SECONDS`

Update `database_id` / `id` placeholders in `wrangler.jsonc` after creating resources.

### Secrets

`JWT_SECRET` is **not** stored in `wrangler.jsonc`. Set it as a Wrangler secret:

```bash
wrangler secret put JWT_SECRET
```

Never commit real secret values.

## Deploy to Cloudflare

```bash
# Create D1 database and R2 bucket first:
wrangler d1 create little_paradise_db
wrangler r2 bucket create little-paradise-assets
# Update database_id in wrangler.jsonc, then:
npm run cf:build
npm run cf:deploy
# Apply migrations:
wrangler d1 migrations apply little_paradise_db
```

## API Routes

Auth:
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`

Catalog:
- `GET /api/tracks`, `GET /api/tracks/[id]`, `GET /api/tracks/[id]/lyrics`, `PUT /api/tracks/[id]/lyrics-offset`, `GET /api/tracks/[id]/stream`
- `GET /api/artists`, `GET /api/albums`

Search:
- `GET /api/search?q=...`

User (auth required):
- `GET /api/me/favorites`, `POST/DELETE /api/me/favorites/[trackId]`
- `GET/POST /api/me/history`
- `GET/PATCH /api/me/preferences`
- `GET/POST /api/playlists`, `GET/PATCH/DELETE /api/playlists/[id]`
- `POST/DELETE /api/playlists/[id]/tracks`, `PATCH /api/playlists/[id]/reorder`

## Demo Content

- Audio tracks are royalty-free SoundHelix samples bundled in `public/audio/`.
- Lyrics are demonstration LRC (clearly labeled as demo).
- Seed data (tracks, artists, albums, playlists, moods) lives in `lib/demo-data.ts`.

Replace with licensed content for production use.

## Notes

- Auth uses bcryptjs + an HttpOnly session cookie; in-memory store in dev, D1 in prod via migrations.
- Player state persists across route changes via Zustand + a single `Audio` instance (`AudioEngine`).
- Images are unoptimized (`next.config.mjs`); the app is configured for Cloudflare Workers.

## License

Private project. All rights reserved. (No license file present.)