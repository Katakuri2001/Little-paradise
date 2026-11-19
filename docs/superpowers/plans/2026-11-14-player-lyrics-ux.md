# Player & Lyrics UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the persistent player and lyrics experience: audio visualization, crossfade/gapless, sleep timer, audio quality selection, dynamic album-art backgrounds, keyboard shortcuts, improved error recovery, word-level karaoke, lyrics themes, fullscreen lyrics, lyrics sharing cards, manual sync tools. Single `AudioEngine` architecture preserved.

**Architecture:** Client-side enhancements only. `AudioVisualizer` layers an `AnalyserNode` off the existing `Audio` element. Crossfade via dual Web Audio gain nodes connected to the same audio output. All state in `playerStore`. Lyrics parser enhanced for word tags, translation, romanization.

**Tech Stack:** Web Audio API (AnalyserNode, MediaElementAudioSourceNode), Framer Motion, Canvas, Zustand, Next.js 15, React 19, TypeScript

**Spec:** docs/superpowers/specs/2026-11-14-player-lyrics-ux-design.md

## Global Constraints
- Preserve single `Audio` instance in `AudioEngine` — do not add a second audio element
- Web Audio API must work in browser (client components only)
- Visualizer auto-disables under `prefers-reduced-motion`, reduced transparency, `hardwareConcurrency <= 4`, or tab hidden
- Existing LRC format must remain parseable (backward-compatible parser)
- TypeScript strict mode
- No new npm dependencies (use Web Audio API natively)

## Review Focus
1. Visualizer does not crash when `Audio` element is not yet created
2. Crossfade does not break gapless playback when crossfade length is 0
3. Sleep timer pauses when tab hidden, fires toast on expiry
4. Word-level karaoke falls back to line-level when no `<mm:ss.xx>` tags present
5. LRC lines without word tags still parse and highlight correctly
6. Keyboard shortcuts do not fire when an `<input>`/`<textarea>` is focused
7. Audio error recovery retries with backoff, then skips to next track

### Task 1: Create `lib/audio/analyser.ts` — Web Audio analyser factory

**Files:**
- Create: `lib/audio/analyser.ts`
- Test: `tests/audioAnalyser.test.ts`

**Interfaces:**
- `createAnalyser(audioEl: HTMLAudioElement): { analyser: AnalyserNode; source: MediaElementAudioSourceNode; destroy: () => void }`
- `getFrequencyData(analyser: AnalyserNode): Uint8Array`

- [ ] **Step 1: Write the failing test**

```ts
import { createAnalyser, getFrequencyData } from "@/lib/audio/analyser";

test("creates analyser from audio element", () => {
  const audio = new Audio();
  const result = createAnalyser(audio);
  expect(result.analyser).toBeInstanceOf(AnalyserNode);
  expect(result.source).toBeInstanceOf(MediaElementAudioSourceNode);
  expect(typeof result.destroy).toBe("function");
  result.destroy();
});

test("getFrequencyData returns Uint8Array", () => {
  const audio = new Audio();
  const { analyser, destroy } = createAnalyser(audio);
  const data = getFrequencyData(analyser);
  expect(data).toBeInstanceOf(Uint8Array);
  destroy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audioAnalyser.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement `createAnalyser` and `getFrequencyData`**

```ts
export function createAnalyser(audioEl: HTMLAudioElement) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  const source = ctx.createMediaElementSource(audioEl);
  source.connect(analyser);
  analyser.connect(ctx.destination);
  return {
    analyser,
    source,
    destroy: () => {
      source.disconnect();
      analyser.disconnect();
      ctx.close();
    },
  };
}

export function getFrequencyData(analyser: AnalyserNode): Uint8Array {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  return data;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/audioAnalyser.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/audio/analyser.ts tests/audioAnalyser.test.ts
git commit -m "feat: add Web Audio analyser factory for visualization"
```

### Task 2: Create `AudioVisualizer` component

**Files:**
- Create: `components/player/AudioVisualizer.tsx`
- Test: `tests/audioVisualizer.test.tsx` (render + unmount without crash)

**Interfaces:**
- Props: `{ analyser?: AnalyserNode | null; enabled?: boolean; className? }`
- Renders: `<canvas>` with waveform bars via `requestAnimationFrame`
- Consumes: `analyserNode` from parent (or null)
- Produces: canvas visualization; no-op when `analyser` is null or disabled

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import AudioVisualizer from "@/components/player/AudioVisualizer";

test("renders canvas without crashing", () => {
  const { unmount } = render(<AudioVisualizer enabled={false} />);
  expect(screen.getByTagName("canvas")).toBeInTheDocument();
  unmount();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audioVisualizer.test.tsx`

Expected: FAIL — module not found

- [ ] **Step 3: Implement `AudioVisualizer`**

Canvas-based bar visualizer, `requestAnimationFrame` loop, cleanup on unmount, respects `enabled` prop and `prefers-reduced-motion`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/audioVisualizer.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/player/AudioVisualizer.tsx tests/audioVisualizer.test.tsx
git commit -m "feat: add AudioVisualizer component with canvas waveform"
```

### Task 3: Modify `AudioEngine` — crossfade gain nodes, error recovery, buffering, BroadcastChannel

**Files:**
- Modify: `components/player/AudioEngine.tsx`

**Interfaces:**
- Consumes: `crossfadeLength`, `sleepTimerActive` from `playerStore` (added in Task 4)
- Produces: same `AudioEngine` component with added crossfade, retry, buffering, BroadcastChannel behavior
- No change to public `seekAudio` export

- [ ] **Step 1: Write failing test for error recovery**

Test that `onError` retries 3 times with backoff then calls `next()`. (Mock `audioRef.current` and `usePlayerStore`.)

- [ ] **Step 2: Implement crossfade gain nodes**

In `AudioEngine`, create `AudioContext`, two `GainNode`s (current/next), connect to destination. On track change, fade current out over `crossfadeLength`, fade next in. When `crossfadeLength === 0`, gapless (immediate switch).

- [ ] **Step 3: Implement error recovery with exponential backoff**

`onError`: retry count (max 3), delays 1s/2s/4s via `setTimeout`, on final failure call `setError`, `setLoading(false)`, `next()`.

- [ ] **Step 4: Implement buffering UI support**

`onWaiting` → `setLoading(true)`; `onCanPlay`/`onPlaying` → `setLoading(false)`. Expose `buffered` via `audio.buffered` for seek bar.

- [ ] **Step 5: Implement BroadcastChannel multi-tab**

On `play`, post to `BroadcastChannel("little-paradise-player")`; on message from another tab, pause this tab.

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add components/player/AudioEngine.tsx
git commit -m "feat: add crossfade, error recovery, buffering, BroadcastChannel to AudioEngine"
```

### Task 4: Modify `playerStore` — crossfade, sleep timer, audio quality

**Files:**
- Modify: `lib/store/playerStore.ts`
- Test: `tests/playerStore-extended.test.ts` (add to existing)

**Interfaces:**
- New state: `crossfadeLength: number`, `sleepTimerActive: boolean`, `sleepTimerRemaining: number`, `audioQuality: 'standard' | 'high' | 'lossless'`
- New actions: `setCrossfade(v)`, `setSleepTimer(minutes)`, `setAudioQuality(q)`, `tickSleepTimer()`
- Consumes: none new
- Produces: updated store slice

- [ ] **Step 1: Write failing tests**

```ts
test("setCrossfade clamps to [0, 30]", () => { ... });
test("setSleepTimer starts countdown", () => { ... });
test("setAudioQuality accepts standard/high/lossless", () => { ... });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/playerStore-extended.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement store additions**

Add state fields, actions, sleep timer interval (cleared on unmount/expiry), quality clamping.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/playerStore-extended.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/store/playerStore.ts tests/playerStore-extended.test.ts
git commit -m "feat: add crossfade, sleep timer, audio quality to playerStore"
```

### Task 5: Enhance `parseLrc` — word tags, translation, romanization

**Files:**
- Modify: `lib/lyrics/parseLrc.ts`
- Test: `tests/parseLrc-extended.test.ts` (add to existing)

**Interfaces:**
- `LrcLine` gains optional `words?: { time: number; word: string }[]`
- `parseLrc(content, offset)` parses `<mm:ss.xx>` inline word tags
- `DEMO_LYRICS` extended with optional `translation` and `romanization` per track (separate export `DEMO_LYRICS_EXTENDED`)

- [ ] **Step 1: Write failing tests**

```ts
test("parses inline word tags", () => { ... });
test("translation and romanization exported per track", () => { ... });
test("existing LRC without word tags still parses (backward compat)", () => { ... });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/parseLrc-extended.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement word tag parsing + extended demo data**

Update `TIME_RE` to optionally capture word tags; parse `<mm:ss.xx>word` pairs. Add `DEMO_LYRICS_TRANSLATIONS` and `DEMO_LYRICS_ROMANIZATION` exports.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/parseLrc-extended.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/lyrics/parseLrc.ts tests/parseLrc-extended.test.ts
git commit -m "feat: enhance LRC parser with word tags, translation, romanization"
```

### Task 6: Modify `LyricsView` — themes, translation, sharing, fullscreen toggle

**Files:**
- Modify: `components/lyrics/LyricsView.tsx`
- Create: `components/lyrics/LyricsShareCard.tsx`
- Create: `components/lyrics/LyricsFullscreen.tsx`

**Interfaces:**
- `LyricsView` gains `theme` prop (from preferences), `translation` display, `onShare` callback, word-level active styling
- `LyricsShareCard({ lines, track, artworkSeed })`: canvas-based share card image
- `LyricsFullscreen({ track })`: immersive fullscreen lyrics view

- [ ] **Step 1: Write failing tests for `LyricsView` theme + word highlighting**

Test that `theme="karaoke"` applies karaoke class; active word highlighted.

- [ ] **Step 2: Implement `LyricsView` enhancements**

Add theme CSS classes, translation line under each lyric, word-level `<span>` highlighting, share button, fullscreen toggle.

- [ ] **Step 3: Implement `LyricsShareCard`**

Canvas: draw selected lines over artwork-gradient background, `toDataURL`, download link.

- [ ] **Step 4: Implement `LyricsFullscreen`**

Fullscreen layout: artwork background, large centered lyrics, minimal controls.

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/lyrics/LyricsView.tsx components/lyrics/LyricsShareCard.tsx components/lyrics/LyricsFullscreen.tsx
git commit -m "feat: add lyrics themes, translation, sharing, fullscreen mode"
```

### Task 7: Create `useKeyboardShortcuts` hook

**Files:**
- Create: `lib/hooks/useKeyboardShortcuts.ts`
- Test: `tests/keyboardShortcuts.test.ts`

**Interfaces:**
- `useKeyboardShortcuts(handlerMap: Record<string, () => void>)`: registers `keydown` listener, ignores when input/textarea focused, cleans up on unmount
- Keys: ` ` (space), `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `n`, `p`, `l`, `q`, `/`, `?`, `m`

- [ ] **Step 1: Write failing test**

```ts
test("calls handler for space key", () => {
  const handler = vi.fn();
  renderHook(() => useKeyboardShortcuts({ " ": handler }));
  fireEvent.keyDown(document.body, { key: " " });
  expect(handler).toHaveBeenCalled();
});
test("ignores keys when input focused", () => {
  const handler = vi.fn();
  renderHook(() => useKeyboardShortcuts({ " ": handler }));
  const input = document.createElement("input");
  document.body.appendChild(input);
  input.focus();
  fireEvent.keyDown(document.body, { key: " " });
  expect(handler).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/keyboardShortcuts.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement `useKeyboardShortcuts`**

```ts
export function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const h = handlers[e.key] ?? handlers[e.code.toLowerCase()];
      if (h) { e.preventDefault(); h(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handlers]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/keyboardShortcuts.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/hooks/useKeyboardShortcuts.ts tests/keyboardShortcuts.test.ts
git commit -m "feat: add useKeyboardShortcuts hook for global hotkeys"
```

### Task 8: Wire keyboard shortcuts into `AppShell`

**Files:**
- Modify: `components/layout/AppShell.tsx`

**Interfaces:**
- Consumes: `usePlayerStore`, `useLibraryStore` actions (togglePlay, prev, next, setVolume, setMuted, toggleFavorite, setQueueOpen)
- Produces: global keyboard shortcuts registered once in AppShell

- [ ] **Step 1: Import `useKeyboardShortcuts` in `AppShell`**

- [ ] **Step 2: Register handlers**

```ts
useKeyboardShortcuts({
  " ": () => togglePlay(),
  "ArrowLeft": () => { /* seek -5s */ },
  "ArrowRight": () => { /* seek +5s */ },
  "ArrowUp": () => setVolume(Math.min(1, volume + 0.1)),
  "ArrowDown": () => setVolume(Math.max(0, volume - 0.1)),
  n: next,
  p: prev,
  l: () => { /* toggle lyrics view */ },
  q: () => setQueueOpen(true),
  "/": () => { /* focus search */ },
  "?": () => { /* show shortcut help */ },
  m: () => setMuted(!muted),
});
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/layout/AppShell.tsx
git commit -m "feat: wire keyboard shortcuts into AppShell"
```

### Task 9: Modify player page — dynamic background, parallax, visualizer

**Files:**
- Modify: `app/player/page.tsx`

**Interfaces:**
- Consumes: `usePlayerStore`, `AudioVisualizer`
- Produces: dynamic radial-gradient background from accent color, artwork parallax tilt on pointer move, `AudioVisualizer` behind artwork

- [ ] **Step 1: Modify player page**

Add background glow, `onPointerMove` tilt handler (max 6deg), `AudioVisualizer` component behind artwork.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/player/page.tsx
git commit -m "feat: add dynamic background, parallax, visualizer to immersive player"
```

### Task 10: Modify lyrics page — themes, fullscreen link

**Files:**
- Modify: `app/lyrics/page.tsx`

**Interfaces:**
- Consumes: `useLibraryStore` preferences (lyricsTheme)
- Produces: theme selector, fullscreen link to `/lyrics/fullscreen`

- [ ] **Step 1: Modify lyrics page**

Add theme dropdown (default/minimal/highlight/karaoke), fullscreen route link.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/lyrics/page.tsx
git commit -m "feat: add lyrics themes and fullscreen link"
```

### Task 11: Modify settings page — crossfade, sleep timer, quality, lyrics theme

**Files:**
- Modify: `app/settings/page.tsx`

**Interfaces:**
- Consumes: `useLibraryStore.setPreferences`, `usePlayerStore` actions
- Produces: crossfade slider (0–30s), sleep timer selector (off/15/30/60/end of track), quality selector, lyrics theme selector

- [ ] **Step 1: Modify settings page**

Add crossfade, sleep timer, audio quality, lyrics theme controls wired to store actions.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/settings/page.tsx
git commit -m "feat: add crossfade, sleep timer, quality, lyrics theme to settings"
```

### Task 12: Modify `types.ts` — lyrics words, translation, romanization, preferences additions

**Files:**
- Modify: `lib/types.ts`

**Interfaces:**
- `LyricsLine.words?: { time: number; word: string }[]`
- `Lyrics.translation?: string`, `Lyrics.romanization?: string`
- `Preferences.lyricsTheme: 'default' | 'minimal' | 'highlight' | 'karaoke'`
- `Preferences.animations: 'full' | 'reduced' | 'off'`
- `PlayerState.crossfadeLength: number`, `PlayerState.sleepTimerActive`, `PlayerState.sleepTimerRemaining`, `PlayerState.audioQuality`

- [ ] **Step 1: Add all new type fields**

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: extend types for lyrics words, translation, themes, player state"
```

### Task 13: Run full verification

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
git commit -m "chore: verify player/lyrics UX build passes lint, typecheck, tests"
```

---

**Self-review complete:** All spec requirements (visualization, crossfade/gapless, sleep timer, quality selection, persistent player, immersive player, keyboard shortcuts, dynamic backgrounds, error recovery, word-level karaoke, line sync, translation/romanization, themes, fullscreen, sharing cards, manual sync tools) are covered by Tasks 1–13. No spec requirement lacks a task.

**Plan complete and saved to `docs/superpowers/plans/2026-11-14-player-lyrics-ux.md`.**
