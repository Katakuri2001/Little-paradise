# Foundation & Security — Design Spec

**Sub-project:** Foundation & Security  
**Status:** Proposed (awaiting approval)  
**Date:** 2026-11-15  
**Depends on:** Additive migration `0002.sql` (already committed — users.role/status, app_settings, audit_log, tracks metadata)

---

## 1. Intent & Scope

Harden Little Paradise for production on Cloudflare Workers. Move from dev-only in-memory state to server-side, revocable, auditable infrastructure. Build the **real** admin dashboard with server-side role-based access control (RBAC) and protected API endpoints wired to the UI.

**Scope:**
- D1-backed sessions (revocable, survives deploys, shared across Workers)
- CSRF protection on cookie-authenticated mutating routes
- Security headers (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Distributed rate limiting via KV (falls back to in-memory in dev)
- Secret management: `JWT_SECRET` as Wrangler secret (not in `vars`)
- Next.js middleware route protection (`/library`, `/profile`, `/settings`, `/api/me/*`, `/admin/*`)
- RBAC enforcement on every admin API route (`role === 'admin'`)
- Ownership verification on `/api/playlists/[id]` and `/api/me/*` (no IDOR)
- Audit logging to `audit_log` table
- Real admin dashboard wired to protected API endpoints

**Out of scope:** JWT issuance (sessions remain opaque random tokens), external identity providers, email verification/password reset (deferred), two-factor auth.

---

## 2. Architecture

### 2.1 Session Management

**Current:** `sessions` Map in memory (`lib/server/store.ts`) — lost on deploy, not shared across Workers instances, not revocable.

**Target:** D1 `sessions` table (already in `0002.sql`):
- `token TEXT PK`, `user_id TEXT FK→users`, `expires_at TEXT`, `created_at TEXT`
- `createSession(userId)` → insert row, return token
- `getSessionUser(token)` → validate + resolve user
- `deleteSession(token)` → delete row (logout)
- `revokeUserSessions(userId)` → delete all (sign out of all devices)
- `cleanupExpiredSessions()` — delete expired rows (run on startup or cron)

**Dev parity:** `getDB()` returns null in local dev → fall back to in-memory `Map` (existing behavior preserved). D1 used on Workers.

### 2.2 Authentication Cookie

- Cookie name: `lp_session` (unchanged)
- `HttpOnly`, `SameSite=Lax`, `path=/`, `maxAge=7 days`
- `Secure`: `true` when `NODE_ENV === "production"` (existing), extended to also be true when `VERCEL_ENV === "preview"` or when behind HTTPS proxy
- Session rotated on login (delete old token, create new) — already done, keep

### 2.3 CSRF Protection

All cookie-authenticated mutating routes (`POST`, `PATCH`, `PUT`, `DELETE`) under `/api/me/*`, `/api/playlists/*`, `/api/admin/*` require an `Origin` header matching the request host, OR a `X-CSRF-Token` header matching a `csrf_token` cookie (double-submit pattern).

**Chosen:** `Origin`/`Referer` header check (simpler, no client changes). If `Origin` is missing or doesn't match the host → `403 CSRF_ERROR`. Safe methods (`GET`, `HEAD`, `OPTIONS`) exempt.

### 2.4 Security Headers

Added via `next.config.mjs` `headers()`:
- `Content-Security-Policy`: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'self';`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

### 2.5 Rate Limiting (Distributed)

**Current:** in-memory `Map` — per-instance, lost on restart, not shared across Workers.

**Target:** KV-backed fixed-window counter:
- Key: `rl:{prefix}:{identifier}` (e.g., `rl:register:1.2.3.4`)
- Value: JSON `{count, resetAt}`
- KV `get`/`set` with expiration TTL = window
- Fallback to in-memory `Map` if KV unavailable (dev parity)

Endpoints rate-limited: register (5/min), login (10/min), search (30/min), admin writes (100/min per admin).

### 2.6 Route Protection (Next.js Middleware)

`middleware.ts` at project root:
- Public: `/`, `/explore`, `/search`, `/library` (read), `/auth/*`, `/api/auth/*`, `/api/tracks*`, `/api/artists*`, `/api/albums*`, `/api/search*`
- Auth-required: `/library` (write), `/profile`, `/settings`, `/api/me/*`, `/api/playlists*`, `/api/playlists/[id]*`, `/admin/*`
- Unauthenticated → redirect to `/auth/login?next=<path>` (for pages) or `401` (for API)
- Authenticated + `/admin/*` → require `role === 'admin'`, else `403`

Role check in middleware: read `lp_session` cookie, call `getSessionUser(token)`, inspect `user.role`. To avoid a D1 read on every request, cache user role in KV for 5 minutes or accept one D1 read per protected navigation (acceptable for MVP).

### 2.7 IDOR / Privilege Escalation Protection

Every route handler that takes a user-owned resource ID:
- `/api/playlists/[id]` — verify `playlist.user_id === currentUser.id`
- `/api/me/favorites/[trackId]`, `/api/me/history` — operate on `currentUser.id` only
- `/api/admin/*` — verify `currentUser.role === 'admin'`
- Never trust client-supplied `userId`; always derive from session

### 2.8 Audit Logging

Write to `audit_log` table (already in `0002.sql`):
- `id`, `user_id` (nullable), `action`, `target_type`, `target_id`, `details`, `created_at`
- Admin actions (create/delete user, suspend, unpublish track, curate playlist) write an audit row
- Helper: `auditLog({userId, action, targetType, targetId, details})` — fire-and-forget, never blocks response

---

## 3. API Endpoints

### Real admin routes (all require `role === 'admin'`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Platform totals (users, tracks, playlists, plays today) |
| GET | `/api/admin/audit-log` | Recent admin activity (paginated) |
| GET | `/api/admin/users` | List all users (paginated) |
| PATCH | `/api/admin/users/[id]` | Promote to admin / suspend / activate |
| DELETE | `/api/admin/users/[id]` | Delete user + cascade |
| GET | `/api/admin/tracks` | List all tracks |
| PATCH | `/api/admin/tracks/[id]` | Unpublish / publish / edit metadata |
| DELETE | `/api/admin/tracks/[id]` | Delete track |
| GET | `/api/admin/playlists` | List all playlists |
| PATCH | `/api/admin/playlists/[id]` | Feature / unfeature playlist |

### Existing routes hardened

| Path | Change |
|------|--------|
| `/api/auth/register` | Add CSRF + rate limit (5/min) — already rate-limited |
| `/api/auth/login` | Add CSRF + rate limit (10/min) — already rate-limited |
| `/api/me/*` | Add CSRF on mutating methods; ownership by session |
| `/api/playlists/[id]` | Add ownership check + CSRF on PATCH/DELETE |

---

## 4. Files Touched

**New:**
- `middleware.ts` — route protection + CSRF + security headers
- `lib/server/session-store.ts` — D1-backed session CRUD + revocation
- `lib/server/kv-rate-limit.ts` — KV distributed rate limiter + in-memory fallback
- `lib/server/audit-log.ts` — audit log helper
- `app/api/admin/stats/route.ts`
- `app/api/admin/audit-log/route.ts`
- `app/api/admin/users/route.ts` (GET list)
- `app/api/admin/users/[id]/route.ts` (PATCH, DELETE)
- `app/api/admin/tracks/route.ts` (GET list)
- `app/api/admin/tracks/[id]/route.ts` (PATCH, DELETE)
- `app/api/admin/playlists/route.ts` (GET list)
- `app/api/admin/playlists/[id]/route.ts` (PATCH)

**Modified:**
- `lib/server/store.ts` — sessions via D1; add `revokeUserSessions`, `cleanupExpiredSessions`
- `lib/server/auth-helper.ts` — cookie `Secure` logic
- `lib/server/rate-limit.ts` — KV-backed `checkRateLimit` with fallback
- `lib/types.ts` — add `AdminAction`, `AuditLogEntry` types
- `wrangler.jsonc` — remove `JWT_SECRET` from `vars` (move to Wrangler secret)
- `next.config.mjs` — add `headers()` for security headers
- `app/admin/users/page.tsx` — wire to real API
- `app/admin/tracks/page.tsx` — wire to real API
- `app/admin/playlists/page.tsx` — wire to real API
- `app/admin/dashboard/page.tsx` — real stats from API
- `app/admin/analytics/page.tsx` — real audit log from API

---

## 5. Design Decisions & Trade-offs

| Decision | Rationale |
|----------|-----------|
| D1 sessions (not JWT) | Revocable on logout/password change; survives deploys; shared across Workers |
| `Origin` header CSRF (not double-submit) | Simpler; no client-side token management needed |
| KV rate limiting + in-memory fallback | Works across Workers instances; dev still works without KV |
| Middleware for route protection | Centralized, edge-runs before route handler; consistent auth |
| Role check in middleware + route handlers | Defense in depth; middleware guards navigation, handlers guard mutations |
| Audit log fire-and-forget | Never blocks the user response |
| `JWT_SECRET` as Wrangler secret | Not committed to repo; follows security best practice |

---

## 6. Backward Compatibility

- Existing `/api/auth/*` endpoints unchanged in behavior (just add CSRF + rate limit)
- Dev mode: D1 unavailable → in-memory fallback for sessions and rate limiting
- `role`/`status` optional on `User` type (already additive in `0002.sql`)
- Non-admin users unaffected by middleware (only `/admin/*` requires admin role)

---

## 7. Testing

- Vitest: session-store CRUD, CSRF check logic, KV rate limiter fallback, middleware auth redirect, admin route authorization
- No Playwright yet (deferred to Testing phase)

---

## 8. Compatibility

- Cloudflare Workers: D1, KV, `next.config.mjs` headers all supported
- Next.js 15 App Router: `middleware.ts` supported
- TypeScript strict: all new types explicit

---

**Approval requested:** Please confirm this spec. Once approved, I'll invoke the **writing-plans** skill to create the implementation plan, then begin implementing task-by-task.