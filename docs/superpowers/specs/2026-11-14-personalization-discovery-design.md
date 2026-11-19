# Personalization & Discovery — Design Spec

**Sub-project:** Stream D — Personalization & Discovery  
**Status:** Proposed (awaiting approval)  
**Date:** 2026-11-14  
**Related:** External AI services marked as Future plan (not used)

---

## 1. Intent & Scope

Build a transparent, local-first recommendation system using listening history, favorites, genres, moods, skips, frequency, and user preferences. No external AI. Recommendations are computed client-side from `libraryStore` state and `demo-data.ts` catalog.

**Out of scope:** Server-side recommendation endpoints, collaborative filtering across users, ML models, external AI services (Future plan).

---

## 2. Recommendation Algorithm (Transparent, Content-Based)

**Scoring function** (per candidate track, per user):

```
score(track) = 
  +3.0 if track.id in favorites
  +2.0 * recencyWeight(history)  [played recently = higher]
  +1.0 if track.genre in user.preferences.favoriteGenres
  +1.0 if track matches user.preferences.favoriteMoods
  -2.0 if track.id in skippedTracks
  +1.0 * listenFrequency(track)   [plays / total plays, capped]
  -1.0 if track.id === currentTrack  [don't recommend current]
```

**Weights are configurable constants** in `lib/recommendations/scoring.ts`, fully transparent and auditable.

**Output:** Sorted list of track IDs with scores. Top N = recommendation shelf.

**Data sources (all local):**
- `libraryStore.favorites` (track IDs)
- `libraryStore.history` (trackId, playedAt, listenedDuration)
- `libraryStore.preferences` (theme, accent — not used for recs; genre/mood prefs added)
- Skipped tracks: tracked in `playerStore` (skip = next() before 30s played)
- Listen frequency: derived from history

**New preferences:** `favoriteGenres: string[]`, `favoriteMoods: string[]` (added to `Preferences`, managed in Settings)

---

## 3. Shelves & Surfaces

| Shelf | Source | Location |
|-------|--------|----------|
| **Daily Mix** | Top scored tracks, refreshed daily (date-stamped cache in localStorage) | Home page |
| **Discover Weekly** | Top scored tracks not recently played, weekly refresh | Home page / Explore |
| **Personalized Playlists** | Auto-generated: "Liked in last 30 days", "Most played", "Recently added" | Library |
| **Similar Tracks** | Same genre + artist as current track | Player / track page |
| **New Releases from Followed Artists** | Tracks by artists in `followedArtists` | Explore / Home |

Each shelf: horizontal scrollable, scroll-snap, edge fade masks, skeleton loading, empty state.

---

## 4. Recommendation Feedback

- **Skip tracking:** `playerStore.next()` before 30s = mark track as skipped (negative weight)
- **"Not interested" button:** On track cards in recommendation shelves, removes track from future recs (session-only or localStorage)
- **"Play more like this":** On any track, boosts similar genre/artist tracks temporarily

---

## 5. Files Touched

**New:**
- `lib/recommendations/scoring.ts` — score function, weights
- `lib/recommendations/engine.ts` — `getRecommendations(userState, catalog) => scoredTrack[]`
- `lib/recommendations/shelves.ts` — Daily Mix, Discover Weekly, similar, new releases
- `lib/hooks/useRecommendations.ts` — React hook consuming libraryStore + demo data
- `tests/recommendations.test.ts` — scoring, engine, shelf generation

**Modified:**
- `lib/store/playerStore.ts` — skip tracking (mark skip on early next)
- `lib/store/libraryStore.ts` — `favoriteGenres`, `favoriteMoods`, `setPreferences` already exists
- `lib/types.ts` — `Preferences.favoriteGenres`, `Preferences.favoriteMoods`
- `app/page.tsx` (Home) — Daily Mix, Discover Weekly shelves
- `app/explore/page.tsx` — Similar tracks, followed artists releases
- `app/library/page.tsx` — Personalized playlists
- `app/settings/page.tsx` — favorite genres/moods multiselect

---

## 6. Design Decisions

| Decision | Rationale |
|----------|-----------|
| Client-side computation | Zero server/deps; works offline; fully transparent algorithm |
| Configurable weights | Easy to tune without code changes; auditable |
| localStorage cache for daily/weekly refresh | No server needed; date-stamped invalidation |
| Skip = next() before 30s | Simple, correlates with disinterest |
| No external AI | Per user requirement; marked Future plan |

---

## 7. Compatibility

- Cloudflare Workers: Pure client-side, no server impact.
- TypeScript strict: All types explicit.
- Backward compatible: New preference fields optional.

---

**Approval requested:** Please confirm this spec before implementation.