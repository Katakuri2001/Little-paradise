# Phase 1 Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay Phase 1 foundations: async data layer, Zod validation + consistent errors, hardened auth/secrets/rate limits, design tokens + glass surfaces, accessibility basics, CI + first unit tests.

**Architecture:** Keep existing store function signatures but make them async with a D1-or-in-memory selection; add Zod schemas and a handler wrapper; centralize tokens in CSS variables; add global a11y styles; add Vitest + GitHub Actions.

**Tech Stack:** Next.js 15, TypeScript, Zod, Vitest, GitHub Actions, Tailwind, Cloudflare D1/KV.

**Spec:** `docs/superpowers/specs/2026-11-07-phase1-foundations-design.md`

## Global Constraints

- No new runtime deps beyond `zod` and `vitest` (dev).
- Keep existing API response shapes backward compatible where possible; new error shape `{ error: { code, message } }`.
- TypeScript strict; `npm run typecheck` must pass.
- Tests run with `npm test`.

## Review Focus

- Async store callers updated everywhere (no unhandled promises).
- Rate limiter must not block legitimate dev usage (high limits in dev).
- Reduced-motion and reduced-transparency respected, not just CSS.
- Error shape consistent across all routes touched.
- Focus rings visible on all interactive elements.

---

### Task 1: Tooling (Vitest + test scripts)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] Add `zod`, `vitest`, `@vitest/ui`? dev deps. Add scripts `test`, `test:watch`.
- [ ] Create vitest config with jsdom? Use node environment for parseLrc/player store (pure). Set `environment: "node"`.
- [ ] Run `npm install` and `npm test` (should pass empty).

### Task 2: Design tokens + glass surfaces + a11y CSS

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] Add CSS variables for colors/radii/blur/shadows.
- [ ] Add `.glass-subtle`, `.glass-raised`, `.glass-overlay`.
- [ ] Global focus-visible ring styles.
- [ ] Reduced-motion media query disabling animations.
- [ ] Map variables in tailwind config.

### Task 3: Zod schemas + API helpers

**Files:**
- Create: `lib/schemas.ts`
- Create: `lib/server/api.ts`

- [ ] Schemas for register, login, playlist create/update, preferences patch, history add.
- [ ] `jsonError(code, message, status)` and `withErrorHandling(handler)`.

### Task 4: Rate limiter

**Files:**
- Create: `lib/server/rate-limit.ts`

- [ ] `checkRateLimit(key, limit, windowMs)` returning `{ allowed, retryAfter }`.
- [ ] In-memory Map fallback.

### Task 5: Data layer async + db helper

**Files:**
- Create: `lib/server/db.ts`
- Modify: `lib/server/store.ts`

- [ ] `getDB()` returns null in dev.
- [ ] Make store functions async (already some async). Ensure all exported functions async.

### Task 6: Auth hardening

**Files:**
- Modify: `lib/server/auth-helper.ts`
- Modify: `app/api/auth/login/route.ts`, `register`, `logout`, `me`
- Modify: `wrangler.jsonc`

- [ ] Cookie hardening + __Host- prefix attempt (keep lp_session for compat).
- [ ] Rotate session on login.
- [ ] Rate limit auth endpoints.
- [ ] Remove JWT_SECRET from vars, document secrets.

### Task 7: Accessibility in components

**Files:**
- Modify: `components/layout/AppShell.tsx`
- Modify: `components/player/AudioEngine.tsx`? maybe not needed.

- [ ] aria-labels on icon buttons.
- [ ] Contrast fix for play button? keep.
- [ ] Reduced transparency toggle wiring in settings page? Add preference handling.

### Task 8: Settings reduced transparency

**Files:**
- Modify: `app/settings/page.tsx` (if exists)

- [ ] Add toggle storing `reducedTransparency` in preferences.

### Task 9: Tests

**Files:**
- Create: `tests/parseLrc.test.ts`
- Create: `tests/playerStore.test.ts`

- [ ] Unit tests for parseLrc.
- [ ] Unit tests for queue logic.

### Task 10: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] lint, typecheck, test, build.

### Task 11: Update README

- [ ] Document secrets, tests, ci.

---

Execution: native (single session).<|end|><|start|>write to=assistant<|channel|>analysis<|message|>Created file successfully: docs/superpowers/plans/2026-11-07-phase1-foundations.md