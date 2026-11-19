# Little Paradise: Improvement Plan

A detailed roadmap for taking Little Paradise from a polished demo to a production-ready, premium music experience. Covers UI/UX, player and lyrics, performance, backend, security, content, testing, and deployment.

## 1. Where the Project Stands

**Strengths**

- Clear product identity: "Liquid Glass" UI plus synchronized lyrics.
- Solid modern stack: Next.js 15, React 19, TypeScript, Zustand, TanStack Query, Tailwind, Framer Motion.
- A single shared `AudioEngine` that survives route changes, which is the right architecture for a persistent player.
- Cloudflare-native deployment path (D1, R2, KV) with migrations already started.

**Gaps to close**

- Demo-only content (SoundHelix audio, demo LRC lyrics, seed data in `lib/demo-data.ts`).
- Dev uses an in-memory store while production uses D1, so behavior can diverge.
- Images are unoptimized, and there is no mention of tests, accessibility work, or monitoring.
- Several features are listed but their depth is unclear (crossfade, privacy settings, offline behavior, mobile player).

## 2. Priorities at a Glance

| Priority | Area | Goal |
| --- | --- | --- |
| P0 | Content and data | Replace demo content, unify dev and prod data layers |
| P0 | Security and auth | Harden sessions, secrets, rate limits |
| P0 | Accessibility and mobile UI | Make the app usable for everyone on every device |
| P1 | Player and lyrics | Gapless playback, media session, better sync |
| P1 | UI polish | Design tokens, motion system, empty and loading states |
| P1 | Performance | Image pipeline, streaming, caching |
| P2 | Discovery and social | Recommendations, sharing, collaborative playlists |
| P2 | Quality and operations | Tests, CI, observability |

## 3. UI and UX Improvements

### 3.1 Design System and Tokens

- **Centralize tokens.** Move colors, radii, blur levels, shadows, and spacing into CSS variables (for example `--lp-glass-bg`, `--lp-glass-border`, `--lp-blur-md`) and map them in `tailwind.config`. This makes theme and accent switching trivial and consistent.
- **Define glass levels.** Create three named surfaces: `glass-subtle` (cards), `glass-raised` (player bar, drawers), `glass-overlay` (modals, immersive player). Each gets a defined blur, tint opacity, border, and shadow, so depth reads clearly.
- **Dynamic accent from artwork.** Extract a dominant color from album art (for example with a small canvas sampler or `node-vibrant`, computed once and cached in the track record) and feed it into the player background, progress bar, and lyrics highlight.
- **Typography scale.** Pick one display font for headings and one text font for UI. Define a modular scale (12, 14, 16, 20, 24, 32, 48) and a clear lyrics type style (large, high-weight, generous line height).
- **Light and dark themes.** Verify the glass look works in both. Light glass needs stronger borders and slightly more opaque tint to stay legible.

### 3.2 Layout and Navigation

- **Desktop shell.** Collapsible sidebar (icons only at narrow widths), sticky top bar with search, and a bottom player bar that never overlaps content (add bottom padding equal to the bar height).
- **Mobile shell.** Bottom tab bar (Home, Explore, Search, Library) with a mini player docked above it. Swipe up on the mini player to open the immersive player; swipe down to dismiss.
- **Right-hand panel (desktop, optional).** A toggleable "Now Playing" panel with queue, lyrics, and track credits, so users can browse while lyrics stay visible.
- **Breadcrumbs and back behavior.** Make sure back navigation from artist, album, and playlist pages returns to the previous scroll position.
- **Keyboard shortcuts.** Space (play and pause), arrow keys (seek, volume), `N` and `P` (next, previous), `L` (lyrics), `Q` (queue), `/` (focus search), `?` (shortcut help sheet).

### 3.3 Home Page

- **Personalized hero.** Greeting based on time of day, plus a "Continue listening" card that resumes the last track at the last position.
- **Shelves.** Recently played, Made for you (mood-based), New releases, Popular in your genres, and Your playlists. Use horizontally scrollable carousels with scroll-snap and edge fade masks.
- **Skeleton loading.** Every shelf shows glass-styled skeleton cards with a soft shimmer, never a blank area or layout shift.
- **Empty states.** For new users, show a friendly onboarding card ("Pick 3 moods to start") instead of empty shelves.

### 3.4 Explore and Search

- **Mood explorer.** Turn moods into large gradient tiles with subtle animated backgrounds. Clicking one opens a mood page with a hero, top tracks, and a one-tap "Play mood" button.
- **Mood intensity slider.** Optional filter such as calm to energetic, using tempo and energy metadata.
- **Instant search.** Debounced (200 to 300 ms) search-as-you-type with grouped results (Tracks, Artists, Albums, Playlists), keyboard navigation, and highlighted matching text.
- **Recent and trending searches.** Show them when the field is focused but empty. Allow clearing individual recent searches.
- **Filters.** Chips for type, genre, and year, with the active filter state kept in the URL.

### 3.5 Player Bar and Immersive Player

- **Player bar.** Artwork, title, artist, favorite heart, previous, play and pause, next, seek bar with hover time preview, volume, queue, lyrics toggle, and expand button. Hide secondary controls on narrow widths rather than shrinking everything.
- **Immersive player.** Blurred, color-reactive background derived from the artwork, large artwork (with a subtle parallax tilt on desktop), and a toggle between Artwork and Lyrics views with a smooth shared-element transition (Framer Motion `layoutId`).
- **Visualizer (optional).** A light audio visualizer using the Web Audio `AnalyserNode` behind the artwork, with a setting to disable it and automatic disabling under reduced motion or low battery.
- **Queue drawer.** Drag-to-reorder (use `@dnd-kit`), swipe to remove on mobile, "Play next" and "Add to queue" actions, and a clear separation between "Now playing", "Next up", and "From autoplay".
- **Micro-interactions.** Heart burst animation on favorite, press states on all buttons, animated equalizer bars on the currently playing row, and a smooth progress bar with a draggable thumb that grows on hover.

### 3.6 Lyrics Experience

- **Line focus effect.** Current line at full opacity and scale, neighbors faded and slightly blurred with distance, and smooth easing scroll that keeps the active line about one third from the top.
- **Word-level highlighting.** Support enhanced LRC (`<mm:ss.xx>` word tags) and fill the active line word by word. Fall back gracefully to line-level sync.
- **Manual scroll handling.** When the user scrolls manually, pause auto-scroll and show a "Jump to current line" pill; resume automatically after a few seconds of inactivity.
- **Tap to seek.** Already supported. Add a subtle hover state and a visible focus ring for keyboard users.
- **Offset control.** Provide a small ± control with 100 ms steps and a reset button, saved per track via the existing offset endpoint. Show the current offset value.
- **Instrumental breaks.** Show an animated three-dot gap indicator during long gaps between lines.
- **Typography options.** Font size (S, M, L), alignment (left, center), and a translation line under each lyric line when available.
- **Share a lyric card (optional).** Let users pick lines and export a styled image card using the artwork palette.

### 3.7 Library, Playlists, and Favorites

- **Library tabs.** Playlists, Favorites, Albums, Artists, Recently played, with sort (recent, A to Z, date added) and a grid and list view toggle.
- **Playlist editor.** Drag handles for reordering with optimistic updates, multi-select with bulk actions (add to playlist, remove), inline rename, a custom cover (upload to R2 or auto-collage from the first four tracks), and a description field.
- **Add to playlist menu.** Context menu on every track row with a quick "New playlist" option and a checkmark for playlists that already contain the track.
- **Undo toasts.** Every destructive action (remove track, delete playlist) shows a toast with Undo for several seconds, instead of a confirm dialog.
- **Context menus.** Right-click on desktop and long-press on mobile for Play next, Add to queue, Add to playlist, Go to artist, Go to album, Share, and Copy link.

### 3.8 Auth, Profile, and Settings

- **Auth pages.** Glass card centered over an animated gradient background, inline validation, password visibility toggle, a password strength hint, and clear error messages.
- **Profile.** Avatar upload (R2), display name, listening stats (top artists, total listening time, top moods), and a public profile toggle that respects privacy settings.
- **Settings.** Group into Appearance (theme, accent, blur intensity), Playback (volume, autoplay, crossfade length, gapless), Lyrics (size, alignment, offset defaults), and Privacy (history, public profile). Show changes immediately with a live preview.
- **Reduced transparency option.** A toggle that replaces glass blur with solid surfaces for users who find blur hard to read, and for low-end devices.

### 3.9 Motion System

- Define shared Framer Motion variants (`fadeUp`, `scaleIn`, `slideInRight`) and durations (fast 150 ms, base 250 ms, slow 400 ms) in one file, and reuse them everywhere.
- Animate route transitions subtly (fade plus small translate), and keep the player bar outside the transition so it never flickers.
- Respect `prefers-reduced-motion`: disable parallax, visualizer, and large transitions, and keep only simple fades.

### 3.10 States and Feedback

Every screen needs four designed states: loading (skeleton), empty (illustration and call to action), error (message and retry button), and offline (banner with what still works). Add a global toast system for confirmations and errors, positioned above the player bar.

### 3.11 Scroll and Interactive Animations

Scroll and interaction motion should make the glass UI feel alive and responsive without costing speed: every effect below has a trigger, a technique, and a reduced-motion fallback.

**Scroll animations**

- **Reveal on scroll.** Use Framer Motion `whileInView` with `viewport={{ once: true, margin: "-10%" }}` and a `fadeUp` variant. Stagger cards in shelves and grids by 40 to 60 ms, capped at about 12 items; anything beyond appears instantly.
- **Parallax hero.** Use `useScroll` and `useTransform` to move hero artwork and background at 0.3 to 0.5 times scroll speed. Clamp the range and enable on desktop only.
- **Collapsing header.** Over the first 120 px of scroll, increase the top bar's blur and background opacity. On artist, album, and playlist pages, the large title shrinks and slides into the sticky bar.
- **Detail page hero.** As the user scrolls, the cover scales down and fades while the gradient from the artwork's dominant color deepens.
- **Carousels.** Scroll-snap with edge fade masks, arrow buttons that fade in on hover, and a slight scale-up (1.0 to 1.03) on the card nearest the center.
- **Sticky section headers.** On long lists such as Library, headers stick with a glass background and a small shadow that appears once stuck.
- **Back to top.** A floating glass pill slides in after about 600 px of scroll.
- **Lyrics scroll.** Spring-eased scrolling (stiffness about 120, damping about 20) with each line's scale, opacity, and blur driven by its distance from the active line.
- **Infinite lists.** Skeleton rows fade in as the loading sentinel approaches, and new rows fade in with a small upward shift.
- **Progressive enhancement.** For simple reveals, CSS scroll-driven animations (`animation-timeline: view()`) can replace JavaScript in browsers that support them.

**Interactive animations**

| Element | Interaction | Animation |
| --- | --- | --- |
| Track card or row | Hover | Lifts 4 px, shadow grows, artwork scales to 1.04, play button fades and scales in (150 ms) |
| Play and pause button | Press | Icon morphs between play and pause, button scales to 0.92 on press and springs back |
| Favorite heart | Tap | Pops 1 to 1.3 to 1 with a burst of 6 to 8 small particles, color fills in 200 ms |
| Seek bar | Hover or drag | Track thickens (4 to 8 px), thumb scales in, time tooltip follows the cursor, buffered range animates |
| Volume control | Hover | Slider expands horizontally from the speaker icon |
| Now-playing indicator | Playing | 3 to 4 equalizer bars animate with CSS keyframes and freeze when paused |
| Player bar to immersive player | Click or swipe up | Artwork travels via shared `layoutId`, spring (300/30), background blur grows |
| Queue drawer | Open | Slides in from the right with a spring, items stagger in |
| Queue and playlist reorder | Drag | Dragged row lifts (scale 1.03, bigger shadow) while neighbors shift smoothly (`Reorder.Group` or dnd-kit layout animation) |
| Context menu | Open | Scales from 0.95 at the pointer origin in 120 ms |
| Toasts | Show or dismiss | Slide up above the player bar, swipe to dismiss, Undo toasts show a draining progress line |
| Tabs and filter chips | Select | Active pill or underline glides between items via shared `layoutId` |
| Glass cards and buttons | Pointer move | A soft radial highlight follows the cursor (CSS variables `--mx` and `--my`, updated in `requestAnimationFrame`) |
| Immersive artwork | Pointer move | Tilts up to 6 degrees with perspective, desktop only |
| Mood tiles | Hover | Gradient shifts through animated `background-position`, tile scales slightly |
| Lyric line | Becomes active | Scale, opacity, and blur ease in; word-by-word fill uses an animated `background-clip: text` gradient |
| Route change | Navigate | Fade plus 8 px translate in 200 ms, with the player bar excluded so it never flickers |
| Mobile gestures | Swipe or pull | Mini player swipes up to expand, track rows swipe to reveal Add to queue and Remove, Home supports pull-to-refresh with a glass spinner |

**Timing and easing**

- Use the shared durations: fast 150 ms, base 250 ms, slow 400 ms. Exits run about 30 percent faster than entrances.
- Entrances use `cubic-bezier(0.22, 1, 0.36, 1)`; exits use `cubic-bezier(0.4, 0, 1, 1)`.
- Drag, shared-layout, and drawer motion use a spring preset (stiffness 300, damping 30) so they feel physical.

**Performance and accessibility guardrails**

- Animate only `transform` and `opacity`. Never animate blur radius, width, height, `top`, or `left`, and avoid scroll-linked effects on layers that use `backdrop-filter`.
- Never hijack native scrolling (no scroll-jacking); keep the browser's momentum and scrollbar behavior.
- Disable parallax, cursor sheen, tilt, and particles when `prefers-reduced-motion` is set, when reduced transparency is on, or on low-end devices (`navigator.hardwareConcurrency` of 4 or less, or Save-Data enabled).
- Pause infinite animations (equalizer, animated gradients) when the tab is hidden or the element is off-screen.
- Use `LazyMotion` with `domAnimation` to shrink the Framer Motion bundle, and lazy-load particle and visualizer code.
- Add a Settings control for Animations: Full, Reduced, or Off.
- Never rely on motion alone to show state; keep text and ARIA updates in step.
- Check frame rate with 4x CPU throttling in DevTools before shipping each effect.

**Implementation steps**

1. Create `lib/motion.ts` holding variants, durations, easings, spring presets, and a `useMotionPrefs()` hook that combines reduced-motion, the Settings choice, and device capability.
2. Build reusable wrappers: `Reveal`, `Stagger`, `Pressable`, `ParallaxLayer`, and `GlassSheen`.
3. Roll out in this order: Home shelves and track cards, then the player bar and immersive player, then Library and playlist editing.
4. Add Storybook stories for each wrapper and a Playwright test that runs with reduced motion emulated.

### 3.12 Mobile Responsive Sample Design

A design canvas with six sample screens is available: [Little Paradise: Mobile UI Design](https://claude.ai/artifact/QfVfoNqPSUxTfZyXJqRrAn). Phone screens use a 390 by 844 px frame, and the admin panel is a fluid page that collapses to one column on small screens.

| Screen | Key elements |
| --- | --- |
| Home | Greeting and profile button, Continue listening card with progress, swipeable mood chips, Made for you shelf, mini player, bottom tab bar |
| Now Playing | Close and more buttons, album artwork, synced lyrics panel directly under the artwork, title and artist with favorite heart, seek bar with times, shuffle, previous, play, next, repeat, and a lyrics, queue, volume row |
| Library | Title and search, swipeable filter chips (Playlists, Favorites, Albums, Artists), recently added list with row menus, New playlist button, mini player, tab bar |
| Login | Logo, email and password fields with labels, forgot password link, Log in, Continue as guest, Create account link |
| Profile (logged in) | Avatar, name and email, stats (listened time, top mood, favorites), settings list (Appearance, Playback, Lyrics, Privacy), Admin panel row for admins, Log out |
| Admin panel | Sidebar, stat cards, track upload form, app controls, tracks table |

**Mobile design rules used in the sample**

- **Hidden scrollbars on swipe rows.** Horizontal rows (mood chips, library tabs, shelves) scroll by touch or drag with no visible bar: `scrollbar-width: none`, `-ms-overflow-style: none`, and `::-webkit-scrollbar { display: none }`. Keep `scroll-snap` and edge fade masks so users can still tell the row continues. Keep keyboard scrolling working, and never hide the bar on the main vertical page scroll.
- **Lyrics under the artwork.** On the player, the synced lyrics panel sits right below the cover, with the active line large and neighbors faded, then title, seek bar, and controls below it.
- **Touch targets.** Every button is at least 44 by 44 px and icon-only buttons carry `aria-label`s.
- **Bottom navigation.** Four tabs (Home, Explore, Search, Library) with a mini player docked above them; profile opens from the avatar on Home.
- **Contrast.** Filled purple buttons use a darker shade (`#6A4AF0`) so white text passes 4.5:1, and muted text stays at 72 percent white or brighter on the dark glass background.
- **Responsive admin.** Below about 760 px the sidebar stacks on top, stat cards go two across, the upload form and app controls stack, and the tracks table scrolls inside its own container.

## 4. Accessibility

- **Contrast.** Check text over glass surfaces against WCAG AA (4.5:1 for body text, 3:1 for large text and icons). Add a subtle dark scrim behind text over bright artwork.
- **Keyboard.** Every control reachable and operable by keyboard, visible focus rings (not removed), focus trapping in drawers and modals, and focus returned to the trigger on close.
- **Screen readers.** Proper labels on icon buttons, `aria-pressed` on toggles (shuffle, repeat, favorite), `role="slider"` with `aria-valuetext` (for example "1:23 of 3:45") on the seek bar, and a polite live region announcing track changes.
- **Lyrics.** Make the lyrics container a labeled region. Do not announce every line change to screen readers; offer a static full-text view instead.
- **Touch targets.** Minimum 44 by 44 px on mobile.
- **Motion and transparency.** Honor reduced motion and offer the reduced transparency setting described above.
- **Testing.** Run axe (via `@axe-core/playwright`) in CI and do manual checks with VoiceOver and NVDA.

## 5. Player and Audio Engine

- **Media Session API.** Set metadata (title, artist, album, artwork) and action handlers (play, pause, next, previous, seek) so lock screen, headphones, and OS media keys work.
- **Gapless and crossfade.** The settings mention crossfade; implement it properly with two audio elements (or Web Audio gain nodes) and preload the next track about 10 to 15 seconds before the end. Provide a true gapless option for albums.
- **Resume state.** Persist queue, current index, and position to `localStorage` (and to the server for signed-in users) so refreshes and new sessions resume correctly.
- **Error recovery.** Handle stalled, failed, and expired streams: retry with backoff, then skip to the next track with a toast. Never leave the player stuck in a loading state.
- **Buffering UI.** Show buffered range on the seek bar and a subtle spinner on the play button when waiting.
- **Audio normalization.** Store loudness data (LUFS or ReplayGain) per track and apply gain to avoid volume jumps between tracks.
- **Equalizer (optional).** A simple 5 to 10 band EQ with presets using Web Audio `BiquadFilterNode`.
- **Streaming endpoint.** Ensure `/api/tracks/[id]/stream` supports HTTP range requests (`206 Partial Content`, `Accept-Ranges`) so seeking works without downloading the whole file. Serve from R2 with proper `Cache-Control`.
- **Multi-tab behavior.** Use `BroadcastChannel` so playing in a new tab pauses the others.
- **Store hygiene.** Keep high-frequency state (current time) out of the main Zustand slice, or use selectors and `subscribeWithSelector`, so only the progress components re-render each tick.

## 6. Lyrics Pipeline

- **Parser hardening.** Handle multiple timestamps per line, `[offset:]` tags, metadata tags, blank lines, and out-of-order timestamps. Add unit tests with real-world edge cases.
- **Binary search for active line.** Use binary search on sorted timestamps instead of a linear scan each frame, and update from `requestAnimationFrame` or `timeupdate` with throttling.
- **Storage.** Move lyrics to a dedicated table (`track_id`, `format`, `language`, `source`, `content`, `updated_at`) so multiple languages and versions are possible. Cache responses in KV.
- **Lyrics contribution (optional).** An admin or trusted-user editor with a live preview where you tap to timestamp each line while the song plays.
- **Licensing.** Real lyrics are copyrighted. Use a licensed provider, or restrict to lyrics you own or have permission for, and keep the "demo" labeling until then.

## 7. Backend, Data, and API

- **One data layer.** Define a repository interface (for example `TrackRepo`, `PlaylistRepo`) with two implementations: D1 for production and a local SQLite or Miniflare D1 for development. Remove the divergent in-memory store, or keep it only for unit tests. Using `wrangler dev` with a local D1 database gives dev and prod parity.
- **Schema improvements.**
  - Indexes on `favorites(user_id, track_id)`, `history(user_id, played_at DESC)`, `playlist_tracks(playlist_id, position)`, and searchable columns.
  - Fractional or gap-based positions for playlist ordering so reorder is a single-row update.
  - Soft delete and `updated_at` columns where useful.
  - Track metadata: duration, BPM, energy, valence, loudness, genres, moods, explicit flag, ISRC.
- **Validation.** Validate every route handler input with Zod and return consistent error shapes (`{ error: { code, message } }`) with correct status codes.
- **Pagination.** Cursor-based pagination on tracks, history, search, and playlists. Pair with TanStack Query `useInfiniteQuery` and virtualized lists (`@tanstack/react-virtual`) for long lists.
- **Search.** Start with D1 FTS5 virtual tables for tracks, artists, and albums (prefix matching, ranking by relevance and popularity). Add typo tolerance later (trigram or an external service).
- **Caching.** Cache catalog endpoints (`GET /api/tracks`, `/artists`, `/albums`) at the edge with `Cache-Control` and `stale-while-revalidate`; use KV for hot lookups and invalidate on write.
- **History batching.** Send play events in batches or on track end (only count a play after about 30 seconds) to reduce writes.
- **API versioning and docs.** Prefix with `/api/v1` and publish an OpenAPI spec generated from the Zod schemas.
- **Admin and ingestion.** A protected admin area (or script) to upload audio and artwork to R2, extract metadata (duration, loudness), and create catalog entries, so content is no longer hard-coded in `demo-data.ts`.

## 8. Security and Privacy

- **Secrets.** Move `JWT_SECRET` out of plain `vars` in `wrangler.jsonc` into Wrangler secrets (`wrangler secret put JWT_SECRET`). Never commit real values.
- **Cookies.** Keep HttpOnly; also set `Secure`, `SameSite=Lax` (or `Strict`), and a `__Host-` prefix where possible. Rotate session identifiers on login.
- **Password hashing.** `bcryptjs` is pure JS and slow on Workers CPU limits. Consider PBKDF2 or Argon2 via WebCrypto or a Workers-compatible library with tuned cost, and benchmark under Worker limits.
- **Sessions.** Consider server-side sessions in KV (revocable) rather than only stateless tokens, so logout and password change can invalidate sessions. Add "sign out of all devices".
- **Rate limiting.** Limit login, register, and search endpoints per IP and per account (Cloudflare rate limiting rules or a KV or Durable Object counter). Add lockout or backoff on repeated failures.
- **CSRF.** For cookie-authenticated mutating routes, check `Origin` or use a CSRF token.
- **Authorization.** Verify ownership on every `/api/playlists/[id]` and `/api/me/*` call; never trust IDs from the client.
- **Headers.** Add a Content Security Policy, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` via `next.config` or middleware.
- **Uploads.** Validate file type and size, and scan or re-encode images before storing in R2.
- **Privacy.** Provide data export and account deletion, honor the history privacy toggle everywhere (including public profile and recommendations), and add a short privacy policy page.
- **Email flows.** Add email verification and password reset (via a transactional email provider) before opening registration publicly.

## 9. Performance

- **Images.** `unoptimized` images hurt load times. Use Cloudflare Images or Image Resizing, or pre-generate multiple sizes (for example 64, 128, 256, 512, 1024 px, in WebP or AVIF) at upload and serve via `srcset`. Add blur placeholders (tiny base64 or a color from the dominant-color step).
- **Bundle size.** Analyze with `@next/bundle-analyzer`. Lazy-load the immersive player, queue drawer, visualizer, and settings with `next/dynamic`. Import Lucide icons individually.
- **Server and client split.** Fetch catalog data in Server Components where possible and hydrate TanStack Query with it, so the first paint has content.
- **Rendering cost of glass.** `backdrop-filter` is expensive. Limit the number of simultaneous blurred layers, avoid blur on scrolling lists, use `will-change` sparingly, and fall back to solid surfaces on low-end devices or when reduced transparency is on.
- **List virtualization.** Virtualize any list that can exceed about 100 rows.
- **Prefetching.** Prefetch the next track's audio and artwork, and prefetch likely routes on hover.
- **Core Web Vitals.** Set targets (LCP under 2.5 s, INP under 200 ms, CLS under 0.1) and track them with real-user monitoring.

## 10. Discovery, Social, and Growth Features

- **Recommendations.** Start simple: content-based using genres, moods, tempo, and energy, combined with listening history and favorites. Add "Because you listened to X" shelves and a "Daily mix".
- **Radio and autoplay.** When the queue ends, continue with similar tracks; label them clearly in the queue.
- **Smart playlists.** Auto playlists such as Most played, Recently added, and Liked in the last 30 days.
- **Sharing.** Public share links for tracks, albums, and playlists with Open Graph images (generated with `@vercel/og`-style rendering or a Worker).
- **Collaborative playlists.** Invite by link, with roles (owner, editor) and an activity log.
- **Listening stats and recap.** A yearly or monthly recap page with top artists, tracks, and moods in a shareable visual.
- **Sleep timer and focus modes.** Sleep timer (15, 30, 60 minutes, end of track) and curated focus or sleep moods.
- **PWA.** Add a web manifest, installable icons, and a service worker for app shell caching. Offline playback of downloaded tracks can come later using the Cache API or IndexedDB.
- **Internationalization.** Extract strings (for example with `next-intl`) and support right-to-left layouts and multiple lyric languages.

## 11. Content and Licensing

- Replace SoundHelix demo audio with content you own, commissioned, or licensed (independent artists, royalty-free libraries with clear terms, or a licensing partner).
- Store licensing metadata (source, license type, attribution text) per track and display attribution where required.
- Keep a clear "demo content" banner until real content is in place.
- Plan for takedown handling and an artist contact process if you open uploads.

## 12. Code Quality and Testing

- **Types.** Share Zod schemas and TypeScript types between client and server (`lib/types.ts` becoming schema-derived).
- **Unit tests.** Vitest for `parseLrc`, player store reducers (queue, shuffle, repeat), and utilities. Aim for strong coverage of anything with edge cases.
- **Integration tests.** Test route handlers against a local D1 using Miniflare or `wrangler` test utilities.
- **End-to-end tests.** Playwright flows: register, login, play a track, favorite, create and reorder a playlist, lyrics sync and seek, queue operations, and mobile viewport.
- **Visual regression.** Playwright screenshots or Storybook with Chromatic for glass components in light and dark themes.
- **Storybook.** Document UI primitives (`Glass`, `Artwork`, buttons, sliders, track rows) in all states.
- **Lint and format.** Add Prettier, `eslint-plugin-jsx-a11y`, and import sorting. Add a pre-commit hook (Husky and lint-staged).
- **CI.** GitHub Actions running lint, typecheck, unit tests, build, and Playwright on every PR, and a preview deployment per branch.

## 13. Observability and Operations

- **Error tracking.** Sentry (or similar) for client and Worker errors, with source maps.
- **Logging.** Structured logs from Workers with request IDs; use Cloudflare Logpush or Workers Logs.
- **Analytics.** Privacy-friendly product analytics (plays, completion rate, skips, search success) to guide decisions.
- **Backups.** Scheduled D1 exports (Time Travel plus periodic dumps to R2).
- **Environments.** Separate dev, staging, and production Cloudflare resources with distinct IDs and secrets.
- **Migrations.** Treat migrations as append-only, test them on staging first, and document the rollback approach.

## 14. Suggested Roadmap

### Phase 1 (Weeks 1 to 2): Foundations

- Unify dev and prod data layers; add Zod validation and consistent errors.
- Move secrets out of config; harden cookies and add rate limiting.
- Centralize design tokens and glass surface levels.
- Add accessibility basics: focus rings, labels, contrast fixes, reduced motion and transparency.
- Set up CI with lint, typecheck, and first unit tests (`parseLrc`, player store).

### Phase 2 (Weeks 3 to 4): Core Experience

- Media Session API, resume state, error recovery, and range-request streaming from R2.
- Redesigned mobile shell: bottom tabs, mini player, swipe gestures.
- Lyrics upgrade: focus effect, manual scroll handling, instrumental indicator, word-level support.
- Skeletons, empty states, error states, and global toasts everywhere.
- Image pipeline with multiple sizes and blur placeholders.

### Phase 3 (Weeks 5 to 6): Depth

- Gapless and crossfade playback, normalization, and queue drag-and-drop.
- Playlist editor upgrades (reorder, bulk actions, covers, undo).
- FTS5 search with filters, recent searches, and keyboard navigation.
- Dynamic accent colors from artwork and the immersive player polish.
- Playwright end-to-end suite and Storybook.

### Phase 4 (Weeks 7 to 8): Growth

- Recommendations, daily mixes, smart playlists, and radio.
- Sharing with Open Graph previews; PWA install and offline shell.
- Admin ingestion tool and real, licensed content.
- Observability, backups, staging environment, and launch checklist.

## 15. Launch Checklist

- [ ] Demo content replaced or clearly labeled and licensed
- [ ] Secrets stored as Wrangler secrets; no secrets in the repo
- [ ] Rate limiting and CSRF protection in place
- [ ] Email verification and password reset working
- [ ] Accessibility audit passed (axe plus manual screen reader checks)
- [ ] Core Web Vitals targets met on mid-range mobile
- [ ] E2E tests green in CI
- [ ] Error tracking and analytics live
- [ ] D1 backups scheduled and a restore tested
- [ ] Privacy policy, terms, and data export or deletion available
- [ ] README updated with architecture, env setup, and contribution notes

## 16. Quick Wins (Do First)

1. Add visible focus styles and `aria-label`s to all icon buttons.
2. Turn on responsive image sizes and blur placeholders.
3. Add the Media Session API (about an hour of work, big perceived quality gain).
4. Persist queue and playback position.
5. Add skeleton loaders and undo toasts.
6. Move `JWT_SECRET` to a Wrangler secret and add `Secure` and `SameSite` cookie flags.
7. Add a reduced transparency toggle in Settings.
8. Write unit tests for `parseLrc` and the queue logic.

## 17. Login System, Logged-in Experience, and Admin Panel

The app needs a complete account flow for listeners and a protected admin area to upload content and control the app. The sample screens are in section 3.12.

### 17.1 Login and Registration

- **Screens.** Login (email, password, show password toggle, Forgot password, Log in, Continue as guest, Create account) and Create account (display name, email, password with strength hint, terms checkbox).
- **Existing endpoints.** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me` already exist; keep the HttpOnly `lp_session` cookie.
- **To add.** Email verification, password reset (`POST /api/auth/forgot`, `POST /api/auth/reset`), a Remember me option that changes the session length, and change password and change email in Settings.
- **Validation and errors.** Inline field errors, clear messages that do not reveal whether an email exists, rate limiting with a visible "try again later" state, and disabled buttons with a spinner while submitting.
- **Guest mode.** Guests can browse and play. Favorites, playlists, history sync, and preferences prompt a friendly sign-in sheet and return the user to the same screen after login.
- **Route protection.** Middleware redirects `/library`, `/profile`, `/settings`, and `/api/me/*` to login for signed-out users, and passes a `next` path so the user lands back where they started.

### 17.2 Logged-in Experience

- **Profile screen.** Avatar, display name, email, and three headline stats (listening time, top mood, favorites), with a settings list for Appearance, Playback, Lyrics, and Privacy.
- **Account state in the shell.** The avatar on Home opens the profile; signed-out users see a Log in button in the same place. The sidebar on desktop shows the user menu at the bottom.
- **Sync.** On login, merge guest favorites and queue into the account, then load preferences (theme, accent, volume, autoplay, crossfade, lyrics options) and apply them before first paint where possible.
- **Session handling.** Show a gentle "session expired" sheet instead of a hard redirect, keep the current queue playing, and offer Sign out of all devices.
- **Admin visibility.** The Admin panel row appears in Profile only when the signed-in user has the admin role; the server still enforces the role on every admin request.
- **Log out.** Clears the cookie, stops syncing, keeps playback running for guests if they choose, and clears private data from client stores.

### 17.3 Admin Panel

A responsive area at `/admin`, hidden from everyone except admins.

| Module | What admins can do |
| --- | --- |
| Dashboard | See totals (tracks, users, plays today, storage used) and recent activity |
| Tracks | Upload audio, add title, artist, album, mood, cover art, and LRC lyrics, save as draft or publish, edit, unpublish, delete |
| Artists and albums | Create and edit artists and albums, upload artwork, merge duplicates |
| Playlists and moods | Curate featured playlists, create and order mood tiles for Explore |
| Users | Search users, view role and status, promote or demote admins, suspend or delete accounts |
| App settings | Open or close registration, maintenance mode, demo content banner, default crossfade, featured mood |

**Upload flow**

1. Admin drops one or more MP3 or FLAC files (up to 50 MB each) or taps Browse files.
2. The file uploads straight to R2 (signed upload URL or a Worker upload route) with a progress bar and cancel.
3. The server reads duration, bitrate, and loudness, and suggests title and artist from tags.
4. Admin completes the form, adds cover art and optional LRC lyrics, and checks a preview that plays the track with lyrics sync.
5. Save as draft (hidden from listeners) or Publish; the catalog cache is invalidated on publish.

**Admin API routes (all require the admin role)**

- `POST /api/admin/uploads` to request an upload URL, and `POST /api/admin/tracks` to create a track record.
- `PATCH` and `DELETE` on `/api/admin/tracks/[id]`, plus `PUT /api/admin/tracks/[id]/lyrics`.
- `GET/POST/PATCH` on `/api/admin/artists`, `/api/admin/albums`, `/api/admin/moods`, and `/api/admin/playlists`.
- `GET/PATCH` on `/api/admin/users` and `/api/admin/users/[id]`.
- `GET/PATCH` on `/api/admin/settings`, and `GET /api/admin/stats`.

**Data model additions**

- `users.role` (`user` or `admin`) and `users.status` (`active` or `suspended`).
- `tracks.status` (`draft` or `published`), `tracks.uploaded_by`, and file metadata columns.
- `app_settings` (key, value, updated\_by, updated\_at) and an `audit_log` table (who, action, target, time).

**Admin security**

- Check the admin role on the server for every `/api/admin/*` request, never only in the UI.
- Validate file type, size, and content; reject anything that is not real audio or an allowed image.
- Rate limit uploads, write every change to the audit log, and require a recent password confirmation for destructive actions (delete user, delete track).
- Offer two-factor authentication for admin accounts, and create the first admin through a one-time setup script rather than a public form.
- Keep admin routes out of search indexes (`noindex`) and out of the public sitemap.

### 17.4 Added Checklist

- [ ] Login, register, forgot and reset password screens built and connected
- [ ] Email verification working before registration is public
- [ ] Guest sign-in prompt and post-login return path working
- [ ] Admin role, audit log, and settings tables migrated
- [ ] Upload to R2 with progress, metadata extraction, and publish flow
- [ ] Admin screens tested at phone and desktop widths with keyboard and screen reader
