# Player & Lyrics UX — Design Spec

**Sub-project:** Stream C — Player & Lyrics UX  
**Status:** Proposed (awaiting approval)  
**Date:** 2026-11-14  
**Related:** Audio Infrastructure (Stream B) for real audio sources; this spec uses existing demo audio

---

## 1. Intent & Scope

Enhance the persistent player and lyrics experience while **preserving the single `AudioEngine` architecture** (one `Audio` instance, survives route changes). Add audio visualization, crossfade/gapless, sleep timer, dynamic album-art backgrounds, keyboard shortcuts, improved error recovery, word-level karaoke, lyrics themes, fullscreen lyrics, lyrics sharing cards, and manual sync tools.

**Preserved:** Single shared `Audio` instance in `AudioEngine`, Media Session API, `playerStore` as source of truth.

---

## 2. Audio Visualization (Web Audio `AnalyserNode`)

**Approach:** Layer an `AnalyserNode` off the existing `Audio` element via a `MediaElementAudioSourceNode`. No new audio element — the single `Audio` stays the source of truth.

**Component:** `AudioVisualizer` (`components/player/AudioVisualizer.tsx`)
- Canvas-based waveform/bars, rendered via `requestAnimationFrame`
- Reads `analyserNode.getByteFrequencyData()` each frame
- Auto-disables under `prefers-reduced-motion`, reduced transparency, low-end devices (`navigator.hardwareConcurrency <= 4`), or when tab hidden (`visibilityState === 'hidden'`)
- Toggled via Settings (Animations: Full / Reduced / Off)
- Placed behind artwork in the immersive player and player bar

**Files:** `components/player/AudioVisualizer.tsx`, `lib/audio/analyser.ts` (new `lib/audio/` dir)

---

## 3. Crossfade & Gapless Playback

**Approach:** Dual gain nodes on the same `AudioContext` (or Web Audio API) connected to the existing `Audio` destination:
- Current track gain fades out over crossfade length (default 0s = gapless, configurable in Settings)
- Next track gain fades in
- Preload next track's audio 10–15s before end
- True gapless option for albums (crossfade = 0)

**Store actions added to `playerStore`:**
- `setCrossfade(seconds: number)`
- `crossfadeLength: number` (from preferences)

**No change to `AudioEngine` single-instance architecture** — the `Audio` element's output connects to the Web Audio gain nodes.

---

## 4. Sleep Timer

**Store actions:**
- `setSleepTimer(minutes: number)` — 15, 30, 60, or end of track
- `sleepTimerRemaining: number`, `sleepTimerActive: boolean`
- Countdown via `setInterval` (1s), pauses when tab hidden
- On expiry: pause playback, clear timer, toast notification

**UI:** Sleep timer control in Settings + player bar (icon + remaining time), dismissible.

---

## 5. Audio Quality Selection

**Data model (additive):** Tracks can have multiple `audio_source_reference` URLs (e.g., 128k, 256k, lossless). For now, demo tracks have one URL each.

**Store:** `audioQuality: 'standard' | 'high' | 'lossless'` in `playerStore`, persisted to localStorage.

**UI:** Quality selector in Settings and player bar. When quality changes, `playTrack` reloads with the matching source URL (falls back gracefully if missing).

---

## 6. Improved Persistent Player

Enhancements to existing `AudioEngine`:
- **Error recovery:** Exponential backoff retry (3 attempts) on `error` event, then skip to next track with toast
- **Buffering UI:** Show buffered range on seek bar; spinner on play button during `waiting`
- **Resume state:** Already persisted via `localStorage` — keep, add `rememberPosition` gating
- **Multi-tab:** `BroadcastChannel` to pause other tabs when one starts playing (optional, low complexity)

**No architectural change** — same `AudioEngine`, same `playerStore`.

---

## 7. Immersive Fullscreen Player

Existing `/player` page enhanced:
- **Dynamic album-art background:** Blurred, color-reactive background derived from artwork gradient (already CSS gradients per `artworkSeed`). Add radial-gradient glow from accent color.
- **Artwork ↔ Lyrics toggle:** Already exists (mode state), smooth transition via Framer Motion `layoutId`
- **Parallax tilt:** On pointer move, artwork tilts up to 6° (desktop only, disabled under reduced motion)
- **Visualizer:** `AudioVisualizer` behind artwork

---

## 8. Keyboard Shortcuts

Global listener (document-level `keydown`, cleaned up on unmount):
| Key | Action |
|-----|--------|
| `Space` | Play / pause |
| `ArrowLeft` / `ArrowRight` | Seek ±5s (hold Shift for ±15s) |
| `ArrowUp` / `ArrowDown` | Volume ±0.1 |
| `N` | Next track |
| `P` | Previous track |
| `L` | Toggle lyrics view |
| `Q` | Toggle queue drawer |
| `/` | Focus search |
| `?` | Shortcut help sheet |
| `M` | Toggle mute |

**Implementation:** `useKeyboardShortcuts` hook (`lib/hooks/useKeyboardShortcuts.ts`), registered in `AppShell` or a top-level provider. Ignore when input/textarea is focused.

---

## 9. Lyrics Experience

### Word-level karaoke
- Enhanced LRC parser: detect `<mm:ss.xx>` word tags inline with line timestamps
- `parseLrc` upgraded to return `LyricsLine[]` where each line has `words: [{ time, word }]`
- Active word highlighted via animated `background-clip: text` gradient; fallback to line-level if no word tags

### Line synchronization (improved)
- Binary search on sorted timestamps instead of linear scan
- Throttled `timeupdate` (30fps via `requestAnimationFrame`)
- Manual scroll pauses auto-scroll; "Jump to current line" pill; resume after 4s

### Translation & romanization
- `Lyrics` type extended: `translation?: string`, `romanization?: string`
- `DEMO_LYRICS` extended per track with optional `translation` and `romanization` fields
- LyricsView shows translation line under each lyric line (toggle in Settings)

### Multiple lyrics display themes
- Themes: `default`, `minimal`, `highlight`, `karaoke`
- Stored in `libraryStore.preferences.lyricsTheme`
- Applied via CSS classes on `LyricsView` container

### Lyrics fullscreen mode
- `/lyrics/fullscreen` route (or fullscreen toggle on `/lyrics`)
- Immersive: large artwork background, lyrics centered, controls hidden until hover

### Lyrics sharing cards
- User selects lines (click to select range)
- Export as styled image card using artwork palette (CSS-generated, canvas `toDataURL`, download)
- "Share lyric card" button in LyricsView

### Manual synchronization tools
- Offset control: ±100ms steps, reset button, saved per track via existing `/api/tracks/[id]/lyrics-offset` endpoint (endpoint deferred to Stream B; UI stores locally for now)
- Current offset value displayed
- "Tap to timestamp" editor (admin/trusted user — placeholder, deferred to Stream B)

**Files:**
- `lib/lyrics/parseLrc.ts` — enhanced parser (word tags, translation, romanization)
- `components/lyrics/LyricsView.tsx` — themes, translation, fullscreen, sharing, word-level
- `components/lyrics/LyricsShareCard.tsx` — new
- `components/lyrics/LyricsFullscreen.tsx` — new
- `lib/hooks/useKeyboardShortcuts.ts` — new
- `lib/store/playerStore.ts` — crossfade, sleep timer, quality actions

---

## 10. Playback Recovery & Error Handling

- `onError` in `AudioEngine`: retry with backoff (1s, 2s, 4s), then `next()` + toast
- `onWaiting`: spinner, `isLoading = true`
- `onCanPlay`: `isLoading = false`
- Seek bar shows `buffered` ranges (visual)

---

## 11. Files Touched

**New:**
- `lib/audio/analyser.ts`
- `components/player/AudioVisualizer.tsx`
- `components/lyrics/LyricsShareCard.tsx`
- `components/lyrics/LyricsFullscreen.tsx`
- `lib/hooks/useKeyboardShortcuts.ts`
- `tests/lyricsParseExtended.test.ts`
- `tests/audioVisualizer.test.ts`

**Modified:**
- `components/player/AudioEngine.tsx` — crossfade gain nodes, error recovery, buffering, BroadcastChannel
- `lib/store/playerStore.ts` — crossfade, sleep timer, quality
- `lib/lyrics/parseLrc.ts` — word tags, translation, romanization
- `components/lyrics/LyricsView.tsx` — themes, translation, sharing, fullscreen toggle
- `app/player/page.tsx` — dynamic background, parallax, visualizer
- `app/lyrics/page.tsx` — themes, fullscreen link
- `app/settings/page.tsx` — crossfade, sleep timer, quality, lyrics theme
- `lib/types.ts` — `LyricsLine.words`, `Lyrics.translation`, `Lyrics.romanization`, `Preferences.lyricsTheme`, `Preferences.animations`, `PlayerState.crossfadeLength`, `PlayerState.sleepTimer*`, `PlayerState.audioQuality`

---

## 12. Compatibility

- Cloudflare Workers: All client-side (Web Audio API available in browsers). No server changes.
- Single `AudioEngine` preserved — no architectural violation.
- Web Audio `AnalyserNode` + `MediaElementAudioSourceNode` widely supported.

---

**Approval requested:** Please confirm this spec before implementation.