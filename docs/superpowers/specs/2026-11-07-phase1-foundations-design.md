# Phase 1 Foundations — Design Spec

**Date:** 2026-11-07
**Scope:** Phase 1 of the Little Paradise Improvement Plan (foundations).
**Goal:** Unify dev/prod data layers, harden auth, centralize design tokens, add accessibility basics, and establish CI + first unit tests.

## 1. Data Layer Parity

- Keep `lib/server/store.ts` function signatures as the repository boundary.
- Make all functions async.
- Add `lib/server/db.ts` exporting `getDB()` that returns the D1 binding from the Cloudflare context when available, else `null`.
- When D1 is available, functions query D1; otherwise fall back to in-memory Maps (dev).
- Use `wrangler dev` with local D1 for parity; document in README.

## 2. Validation and Errors

- Add `lib/schemas.ts` with Zod schemas for auth, playlist, preferences, history inputs.
- Validate every route handler input; return `{ error: { code, message } }` with correct status codes.
- Add `lib/server/api.ts` with `withErrorHandling` wrapper and `jsonError` helper.

## 3. Secrets and Cookies

- Remove `JWT_SECRET` from `vars` in `wrangler.jsonc`; document `wrangler secret put JWT_SECRET`.
- Cookie: HttpOnly, Secure in prod, SameSite=Lax, `__Host-` prefix where possible, 7-day maxAge.
- Rotate session token on login (delete old, create new).

## 4. Rate Limiting

- Add `lib/server/rate-limit.ts` with a counter keyed by IP/account.
- Use KV when available, in-memory Map otherwise.
- Apply to `/api/auth/*` and `/api/search`; return 429 with `Retry-After`.

## 5. Design Tokens

- Move colors, radii, blur, shadows, spacing into CSS variables in `app/globals.css`.
- Map variables in `tailwind.config.ts`.
- Define `.glass-subtle`, `.glass-raised`, `.glass-overlay` utility classes.

## 6. Accessibility Basics

- Global visible focus rings.
- `aria-label`s on icon buttons in `AppShell` and player controls.
- Contrast fixes: darker purple button `#6A4AF0`.
- Respect `prefers-reduced-motion` in Framer Motion.
- Reduced-transparency toggle in settings (stored in preferences).

## 7. CI and Tests

- Vitest config + tests for `parseLrc` and player store queue logic.
- GitHub Actions workflow: lint, typecheck, unit tests, build.

## Out of Scope

Full repository interface refactor, admin panel, crossfade/gapless, image pipeline, Media Session API.