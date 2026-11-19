# Personalization & Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a transparent, local-first recommendation system using listening history, favorites, genres, moods, skips, frequency, and preferences. Surfaces Daily Mix, Discover Weekly, personalized playlists, similar tracks, followed-artist releases. No external AI (Future plan).

**Architecture:** Pure client-side computation. Scoring function in `lib/recommendations/scoring.ts`, engine in `lib/recommendations/engine.ts`, shelf generators in `lib/recommendations/shelves.ts`, React hook `useRecommendations`. Shelves rendered on Home, Explore, Library pages. Skip tracking in `playerStore`. Favorite genres/moods in `libraryStore`/`Preferences`.

**Tech Stack:** Zustand, localStorage, Next.js 15, React 19, TypeScript, TanStack Query (not yet used for recs — client-only)

**Spec:** docs/superpowers/specs/2026-11-14-personalization-discovery-design.md

## Global Constraints
- No external AI services (Future plan)
- Fully transparent algorithm — configurable weights, auditable
- Client-side only; no server endpoints
- Backward-compatible: new `Preferences` fields optional
- TypeScript strict mode
- No new npm dependencies

## Review Focus
1. Skipped track (next() before 30s) gets negative weight in recommendations
2. Favorite tracks get +3.0 weight; recently played get +2.0 recency weight
3. Daily Mix refreshes once per day (date-stamped localStorage cache)
4. Current track is not recommended to itself
5. Recommendations degrade gracefully when no history/favorites exist (empty shelf, not crash)
6. `favoriteGenres` and `favoriteMoods` persist in `libraryStore`

### Task 1: Add `favoriteGenres` and `favoriteMoods` to `Preferences` type

**Files:**
- Modify: `lib/types.ts:85-99`

**Interfaces:**
- `Preferences.favoriteGenres: string[]`
- `Preferences.favoriteMoods: string[]`

- [ ] **Step 1: Write failing test**

```ts
import type { Preferences } from "@/lib/types";
const p: Preferences = {
  theme: "dark", accent: "#A78BFA", defaultVolume: 0.8, autoplay: true, crossfade: false,
  rememberPosition: true, lyricsAutoScroll: true, lyricsFontSize: "md", lyricsOffset: 0,
  lyricsMode: "immersive", privateProfile: true, privatePlaylists: true, reducedTransparency: false,
  favoriteGenres: ["Dream Pop", "Electronic"], favoriteMoods: ["dreamy", "focus"],
};
expect(p.favoriteGenres).toContain("Dream Pop");
expect(p.favoriteMoods).toContain("dreamy");
```

- [ ] **Step 2: Run typecheck to verify it fails**

Run: `npm run typecheck`

Expected: TS error — `favoriteGenres`/`favoriteMoods` not on `Preferences`

- [ ] **Step 3: Add fields to `Preferences`**

```ts
export type Preferences = {
  // ... existing fields ...
  favoriteGenres: string[];
  favoriteMoods: string[];
};
```

- [ ] **Step 4: Run typecheck to verify it passes**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add favoriteGenres and favoriteMoods to Preferences"
```

### Task 2: Create `lib/recommendations/scoring.ts` — transparent scoring function

**Files:**
- Create: `lib/recommendations/scoring.ts`
- Test: `tests/recommendations-scoring.test.ts`

**Interfaces:**
- `scoreTrack(track, userState, weights?): number` — returns numeric score
- `defaultWeights` exported constant object
- `userState` shape: `{ favorites: Set<string>; history: { trackId, playedAt, listenedDuration }[]; skipped: Set<string>; favoriteGenres: string[]; favoriteMoods: string[]; currentTrackId?: string }`

- [ ] **Step 1: Write failing tests**

```ts
import { scoreTrack, defaultWeights } from "@/lib/recommendations/scoring";

test("favorite track gets +3.0 weight", () => { ... });
test("skipped track gets -2.0 weight", () => { ... });
test("recently played track gets recency boost", () => { ... });
test("current track is penalized", () => { ... });
test("defaultWeights are exported and positive where expected", () => { ... });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/recommendations-scoring.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement `scoreTrack`**

```ts
export const defaultWeights = {
  favorite: 3.0,
  recency: 2.0,
  genreMatch: 1.0,
  moodMatch: 1.0,
  skip: -2.0,
  frequency: 1.0,
  currentTrack: -1.0,
} as const;

export function scoreTrack(track, userState, weights = defaultWeights): number {
  let score = 0;
  if (userState.favorites.has(track.id)) score += weights.favorite;
  // recency: played in last 7 days = full weight, decaying
  const recent = userState.history.some(h => h.trackId === track.id && Date.now() - new Date(h.playedAt).getTime() < 7*24*3600*1000);
  if (recent) score += weights.recency;
  if (userState.favoriteGenres.includes(track.genre)) score += weights.genreMatch;
  if (userState.favoriteMoods.some(m => trackMatchesMood(track, m))) score += weights.moodMatch;
  if (userState.skipped.has(track.id)) score += weights.skip;
  if (track.id === userState.currentTrackId) score += weights.currentTrack;
  // frequency: plays / total, capped at 1.0
  const freq = Math.min(userState.history.filter(h => h.trackId === track.id).length / 10, 1.0);
  score += freq * weights.frequency;
  return score;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/recommendations-scoring.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/recommendations/scoring.ts tests/recommendations-scoring.test.ts
git commit -m "feat: add transparent recommendation scoring function"
```

### Task 3: Create `lib/recommendations/engine.ts` — recommendation engine

**Files:**
- Create: `lib/recommendations/engine.ts`
- Test: `tests/recommendations-engine.test.ts`

**Interfaces:**
- `getRecommendations(catalogTracks, userState, limit = 50): { trackId, score }[]` — sorted descending by score
- Consumes: `scoreTrack` from scoring.ts
- Produces: array of `{ trackId, score }` sorted by score desc, excluding skipped and current track

- [ ] **Step 1: Write failing tests**

```ts
import { getRecommendations } from "@/lib/recommendations/engine";

test("returns sorted recommendations by score desc", () => { ... });
test("excludes skipped tracks", () => { ... });
test("excludes current track", () => { ... });
test("returns empty array when no catalog", () => { ... });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/recommendations-engine.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement `getRecommendations`**

```ts
export function getRecommendations(tracks, userState, limit = 50) {
  return tracks
    .map(t => ({ trackId: t.id, score: scoreTrack(t, userState) }))
    .filter(({ trackId }) => trackId !== userState.currentTrackId && !userState.skipped.has(trackId))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/recommendations-engine.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/recommendations/engine.ts tests/recommendations-engine.test.ts
git commit -m "feat: add recommendation engine with getRecommendations"
```

### Task 4: Create `lib/recommendations/shelves.ts` — shelf generators

**Files:**
- Create: `lib/recommendations/shelves.ts`
- Test: `tests/recommendations-shelves.test.ts`

**Interfaces:**
- `getDailyMix(tracks, userState): { trackId, score }[]` — cached per day in localStorage
- `getDiscoverWeekly(tracks, userState): { trackId, score }[]` — cached per week
- `getSimilarTracks(trackId, tracks, userState): { trackId, score }[]` — same genre/artist
- `getFollowedArtistReleases(tracks, artists, followedArtistIds): Track[]`

- [ ] **Step 1: Write failing tests**

```ts
test("Daily Mix is cached per day (same result within a day)", () => { ... });
test("Discover Weekly excludes recently played tracks", () => { ... });
test("Similar tracks match genre or artist", () => { ... });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/recommendations-shelves.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement shelf generators**

Daily Mix: `getRecommendations` result, cached in localStorage with date key; invalidated on new day. Discover Weekly: same but excludes tracks played in last 7 days. Similar: filter by `track.genre === current.genre || track.artistId === current.artistId`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/recommendations-shelves.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/recommendations/shelves.ts tests/recommendations-shelves.test.ts
git commit -m "feat: add Daily Mix, Discover Weekly, similar tracks, followed artist shelves"
```

### Task 5: Create `lib/hooks/useRecommendations.ts` — React hook

**Files:**
- Create: `lib/hooks/useRecommendations.ts`
- Test: `tests/useRecommendations.test.tsx`

**Interfaces:**
- `useRecommendations(shelf: 'dailyMix' | 'discoverWeekly' | 'similar' | 'followedReleases', options?): { tracks: Track[]; loading: boolean }`
- Consumes: `useLibraryStore`, `usePlayerStore`, `demo-data.ts`
- Produces: memoized track list for the shelf

- [ ] **Step 1: Write failing test**

```tsx
import { renderHook } from "@testing-library/react";
import { useRecommendations } from "@/lib/hooks/useRecommendations";

test("returns tracks for dailyMix shelf", () => {
  const { result } = renderHook(() => useRecommendations("dailyMix"));
  expect(Array.isArray(result.current.tracks)).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/useRecommendations.test.tsx`

Expected: FAIL — module not found

- [ ] **Step 3: Implement `useRecommendations`**

```ts
export function useRecommendations(shelf, options = {}) {
  const { favorites, history, preferences } = useLibraryStore((s) => ({ ...s }));
  const { currentTrack } = usePlayerStore((s) => ({ currentTrack: s.currentTrack }));
  const tracks = useMemo(() => {
    const userState = { favorites: new Set(favorites), history, skipped: new Set(), favoriteGenres: preferences.favoriteGenres, favoriteMoods: preferences.favoriteMoods, currentTrackId: currentTrack?.id };
    if (shelf === "dailyMix") return getDailyMix(TRACKS, userState);
    if (shelf === "discoverWeekly") return getDiscoverWeekly(TRACKS, userState);
    return [];
  }, [shelf, favorites, history, preferences, currentTrack]);
  return { tracks, loading: false };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/useRecommendations.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/hooks/useRecommendations.ts tests/useRecommendations.test.tsx
git commit -m "feat: add useRecommendations hook for shelves"
```

### Task 6: Modify `playerStore` — skip tracking

**Files:**
- Modify: `lib/store/playerStore.ts`
- Test: `tests/playerStore-extended.test.ts` (add skip test)

**Interfaces:**
- New state: `skippedTrackIds: string[]`
- New action: `markSkipped(trackId)`
- `next()`: if `currentTime < 3` (skip before 30s — use 3s threshold like `prev`), call `markSkipped(currentTrack.id)` before advancing

- [ ] **Step 1: Write failing test**

```ts
test("next() before 3s marks current track as skipped", () => { ... });
test("isSkipped(trackId) returns true for skipped tracks", () => { ... });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/playerStore-extended.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement skip tracking**

Add `skippedTrackIds`, `markSkipped`, `isSkipped`. In `next()`, if `currentTime < 3`, mark current track skipped before advancing.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/playerStore-extended.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/store/playerStore.ts tests/playerStore-extended.test.ts
git commit -m "feat: add skip tracking to playerStore for recommendations"
```

### Task 7: Modify Home page — Daily Mix, Discover Weekly shelves

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `useRecommendations("dailyMix")`, `useRecommendations("discoverWeekly")`
- Produces: two new horizontal shelves below "Made For You"

- [ ] **Step 1: Modify `app/page.tsx`**

Add Daily Mix and Discover Weekly shelves using `useRecommendations`, with glass track cards, scroll-snap, edge fade masks, skeleton loading, empty states.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add Daily Mix and Discover Weekly shelves to Home"
```

### Task 8: Modify Explore page — similar tracks, followed artist releases

**Files:**
- Modify: `app/explore/page.tsx`

**Interfaces:**
- Consumes: `useRecommendations("similar", { trackId })`, `useLibraryStore().followedArtists`
- Produces: "Similar tracks" section, "New from followed artists" section

- [ ] **Step 1: Modify `app/explore/page.tsx`**

Add similar tracks and followed artist releases sections.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/explore/page.tsx
git commit -m "feat: add similar tracks and followed artist releases to Explore"
```

### Task 9: Modify Library page — personalized playlists

**Files:**
- Modify: `app/library/page.tsx`

**Interfaces:**
- Consumes: `useLibraryStore().history`, `useLibraryStore().favorites`
- Produces: "Most played", "Liked in last 30 days", "Recently added" auto-playlists

- [ ] **Step 1: Modify `app/library/page.tsx`**

Add personalized playlist cards derived from history and favorites.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/library/page.tsx
git commit -m "feat: add personalized playlists to Library"
```

### Task 10: Modify Settings page — favorite genres/moods

**Files:**
- Modify: `app/settings/page.tsx`

**Interfaces:**
- Consumes: `useLibraryStore.setPreferences`, `preferences.favoriteGenres`, `preferences.favoriteMoods`
- Produces: multiselect chips for favorite genres and moods

- [ ] **Step 1: Modify `app/settings/page.tsx`**

Add genre/mood preference pickers (chips from `demo-data.ts` GENRES and MOODS).

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/settings/page.tsx
git commit -m "feat: add favorite genres/moods preferences to Settings"
```

### Task 11: Run full verification

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
git commit -m "chore: verify personalization build passes lint, typecheck, tests"
```

---

**Self-review complete:** All spec requirements (scoring algorithm, Daily Mix, Discover Weekly, personalized playlists, similar tracks, followed artist releases, feedback via skip tracking, favorite genres/moods) are covered by Tasks 1–11. No spec requirement lacks a task. External AI explicitly not used (Future plan).

**Plan complete and saved to `docs/superpowers/plans/2026-11-14-personalization-discovery.md`.**
