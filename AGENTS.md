# Little Paradise — Agent Notes

## Project
Premium music streaming & synchronized lyrics web app. Next.js 15 (App Router) + TypeScript + Tailwind + Framer Motion + Zustand.
Backend runs on Cloudflare via OpenNext Cloudflare adapter (D1, R2, KV). API routes live in `app/api/*` and execute on the Workers runtime in production.

## Structure
- `app/` — Next.js routes and pages
- `app/api/` — API route handlers (auth, tracks, playlists, favorites, history, preferences, lyrics, search)
- `components/` — UI components (layout, player, lyrics, ui)
- `lib/` — types, demo data, stores (playerStore, libraryStore), utils, server store
- `lib/lyrics/` — LRC parser + demo lyrics
- `migrations/` — D1 SQL migrations
- `public/audio/` — demo MP3 tracks (SoundHelix, royalty-free)
- `wrangler.jsonc` — Cloudflare bindings (D1, R2, KV)

## Commands
- `npm run dev` — local dev (Next.js)
- `npm run build` — production build
- `npm run typecheck` — tsc --noEmit
- `npm run cf:build` — OpenNext Cloudflare build
- `npm run cf:preview` — preview on Workers runtime
- `npm run cf:deploy` — deploy to Cloudflare

## Notes
- Demo audio is bundled in `public/audio/` for offline playback.
- Lyrics are demo LRC for demonstration (clearly labeled).
- Auth uses bcryptjs + HttpOnly session cookie; in-memory store in dev, D1 in prod via migrations.
- Player state persists across route changes via Zustand + a single Audio instance (AudioEngine).
