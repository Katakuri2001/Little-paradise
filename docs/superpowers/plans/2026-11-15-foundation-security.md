# Foundation & Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden Little Paradise for production on Cloudflare Workers: D1-backed revocable sessions, CSRF protection, security headers, distributed KV rate limiting, Wrangler secret management, Next.js middleware route protection, server-side RBAC, IDOR protection, audit logging, and a real admin dashboard wired to protected API endpoints.

**Architecture:** Next.js middleware (`middleware.ts`) handles route protection + CSRF + security headers at the edge. D1 `sessions` table stores revocable session tokens (`lib/server/session-store.ts`). KV provides distributed rate limiting with in-memory fallback (`lib/server/kv-rate-limit.ts`). Admin API routes under `/api/admin/*` enforce `role === 'admin'` on the server. Audit writes go to `audit_log` table. Admin UI pages consume the real endpoints.

**Tech Stack:** Next.js 15 App Router middleware, Cloudflare Workers, D1, KV, Zod, TypeScript strict, Zustand

**Spec:** docs/superpowers/specs/2026-11-15-foundation-security-design.md

## Global Constraints
- Preserve existing `/api/auth/*` endpoints behavior (add CSRF + rate limit only)
- Dev mode: D1/KV unavailable → in-memory fallback for sessions and rate limiting
- `role`/`status` optional on `User` type (already additive in `0002.sql`)
- Non-admin users unaffected by middleware (only `/admin/*` requires admin role)
- TypeScript strict mode
- No new npm dependencies (use D1/KV/Web Crypto natively)
- `JWT_SECRET` removed from `wrangler.jsonc` `vars` (move to Wrangler secret)

## Review Focus
1. Unauthenticated access to `/api/me/*` returns `401` (not user data)
2. Non-admin access to `/api/admin/*` returns `403` (not admin data)
3. CSRF: mutating `POST`/`PATCH`/`DELETE` without matching `Origin` returns `403`
4. Session token revoked on logout → subsequent request with same token returns `401`
5. Rate limit exceeded returns `429` with `retry-after`
6. Audit log row written for every admin mutation (create/delete user, suspend, unpublish track, feature playlist)
7. Playlist owner can modify their playlist; another user's playlist returns `403`
8. Expired session token returns `401`, not server error

---

### Task 1: Add security types to `lib/types.ts`

**Files:**
- Modify: `lib/types.ts`
- Test: `tests/security-types.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `AdminAction` type, `AuditLogEntry` type

- [ ] **Step 1: Write the failing test**

```ts
import { expect, test } from "vitest";
import type { AdminAction, AuditLogEntry } from "@/lib/types";

test("AdminAction type accepts admin actions", () => {
  const a: AdminAction = "create_user";
  expect(a).toBe("create_user");
});

test("AuditLogEntry type shape", () => {
  const entry: AuditLogEntry = {
    id: "log1",
    userId: "u1",
    action: "create_user",
    targetType: "user",
    targetId: "u2",
    details: '{"email":"x@y.com"}',
    createdAt: "2026-01-01",
  };
  expect(entry.action).toBe("create_user");
  expect(entry.userId).toBe("u1");
});
```

- [ ] **Step 2: Run typecheck to verify it fails**

Run: `npm run typecheck`

Expected: TS error — `AdminAction`/`AuditLogEntry` not exported

- [ ] **Step 3: Add types to `lib/types.ts`**

```ts
export type AdminAction =
  | "create_user"
  | "suspend_user"
  | "activate_user"
  | "promote_user"
  | "delete_user"
  | "unpublish_track"
  | "publish_track"
  | "delete_track"
  | "feature_playlist"
  | "unfeature_playlist";

export type AuditLogEntry = {
  id: string;
  user_id?: string;
  action: AdminAction;
  target_type?: string;
  target_id?: string;
  details?: string;
  created_at: string;
};
```

- [ ] **Step 4: Run typecheck to verify it passes**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts tests/security-types.test.ts
git commit -m "feat: add security types (AdminAction, AuditLogEntry)"
```

---

### Task 2: Create `lib/server/kv-rate-limit.ts` — distributed rate limiter

**Files:**
- Create: `lib/server/kv-rate-limit.ts`
- Test: `tests/kv-rate-limit.test.ts`

**Interfaces:**
- `checkRateLimitKV(kv: KVNamespace, key: string, limit: number, windowMs: number): { allowed: boolean; retryAfter: number }`
- Consumes: KV namespace binding (may be null in dev), key string, limit number, windowMs number
- Produces: `{ allowed, retryAfter }`
- Falls back to in-memory `Map` when `kv` is null (dev parity)

- [ ] **Step 1: Write the failing test**

```ts
import { expect, test } from "vitest";
import { checkRateLimitKV } from "@/lib/server/kv-rate-limit";

test("allows requests under limit", () => {
  const kv = null; // dev fallback
  const r = checkRateLimitKV(kv as any, "k1", 3, 60_000);
  expect(r.allowed).toBe(true);
});

test("blocks requests over limit", () => {
  const kv = null;
  for (let i = 0; i < 3; i++) checkRateLimitKV(kv as any, "k2", 3, 60_000);
  const r = checkRateLimitKV(kv as any, "k2", 3, 60_000);
  expect(r.allowed).toBe(false);
  expect(r.retryAfter).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/kv-rate-limit.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement `checkRateLimitKV`**

```ts
let memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimitKV(
  kv: KVNamespace | null,
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfter: number } {
  if (kv) {
    // KV-backed path (production Workers)
    // ... implementation below
  }
  // In-memory fallback (dev)
  const now = Date.now();
  const b = memoryBuckets.get(key);
  if (!b || b.resetAt < now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { allowed: true, retryAfter: 0 };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/kv-rate-limit.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/server/kv-rate-limit.ts tests/kv-rate-limit.test.ts
git commit -m "feat: add KV distributed rate limiter with in-memory fallback"
```

---

### Task 3: Create `lib/server/session-store.ts` — D1-backed sessions

**Files:**
- Create: `lib/server/session-store.ts`
- Test: `tests/session-store.test.ts`

**Interfaces:**
- `createSession(db: D1Database, userId: string): Promise<string>` — insert row, return token
- `getSessionUser(db: D1Database, token: string): Promise<User | null>` — validate token, resolve user
- `deleteSession(db: D1Database, token: string): Promise<void>` — delete row (logout)
- `revokeUserSessions(db: D1Database, userId: string): Promise<void>` — delete all rows for user
- `cleanupExpiredSessions(db: D1Database): Promise<void>` — delete expired rows
- Consumes: D1 database binding
- Produces: session token string or user object

- [ ] **Step 1: Write the failing test**

```ts
import { expect, test } from "vitest";
import { createSession, getSessionUser, deleteSession } from "@/lib/server/session-store";

test("createSession returns a token", () => { ... });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/session-store.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement D1 session CRUD**

Use `db.prepare("INSERT INTO sessions ...").bind(...).run()` etc.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/session-store.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/server/session-store.ts tests/session-store.test.ts
git commit -m "feat: add D1-backed session store with revocation"
```

---

### Task 4: Create `lib/server/audit-log.ts` — audit log helper

**Files:**
- Create: `lib/server/audit-log.ts`
- Test: `tests/audit-log.test.ts`

**Interfaces:**
- `auditLog(db: D1Database, { userId, action, targetType, targetId, details }): Promise<void>` — insert row, fire-and-forget
- Consumes: D1 binding, action fields
- Produces: void (never throws)

- [ ] **Step 1: Write the failing test**

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement `auditLog`**

Wrap in try/catch so it never blocks the response.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add lib/server/audit-log.ts tests/audit-log.test.ts
git commit -m "feat: add audit log helper"
```

---

### Task 5: Modify `lib/server/store.ts` — D1 sessions + revocation

**Files:**
- Modify: `lib/server/store.ts`
- Test: `tests/store-sessions.test.ts` (extend existing)

**Interfaces:**
- `sessions` Map replaced by D1 `sessions` table when `getDB()` returns a binding
- `createSession`, `getSessionUser`, `deleteSession` delegate to `session-store.ts`
- Add `revokeUserSessions(userId)`, `cleanupExpiredSessions()`
- Keep in-memory fallback for dev

- [ ] **Step 1: Write failing test for revokeUserSessions**

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Modify store.ts**

Replace `sessions` Map usage with `session-store.ts` calls when D1 available.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add lib/server/store.ts tests/store-sessions.test.ts
git commit -m "feat: migrate sessions to D1 with revocation"
```

---

### Task 6: Modify `lib/server/auth-helper.ts` — Secure cookie

**Files:**
- Modify: `lib/server/auth-helper.ts`

**Interfaces:**
- `setSessionCookie` sets `secure` based on `NODE_ENV === "production"` OR `VERCEL_ENV === "preview"` OR HTTPS proxy
- `clearSessionCookie` unchanged

- [ ] **Step 1: Modify `setSessionCookie`**

Update `secure` condition.

- [ ] **Step 2: Run typecheck**

- [ ] **Step 3: Commit**

```bash
git add lib/server/auth-helper.ts
git commit -m "feat: set Secure cookie flag in production/preview"
```

---

### Task 7: Modify `lib/server/rate-limit.ts` — integrate KV rate limiter

**Files:**
- Modify: `lib/server/rate-limit.ts`

**Interfaces:**
- `checkRateLimit` accepts optional KV namespace; delegates to `checkRateLimitKV` when available
- Backward-compatible signature: `checkRateLimit(key, limit, windowMs)` still works (uses in-memory fallback)

- [ ] **Step 1: Modify `checkRateLimit`**

Add optional `kv` parameter; delegate to `checkRateLimitKV`.

- [ ] **Step 2: Run typecheck + tests**

- [ ] **Step 3: Commit**

```bash
git add lib/server/rate-limit.ts
git commit -m "feat: integrate KV rate limiter into checkRateLimit"
```

---

### Task 8: Create `middleware.ts` — route protection + CSRF

**Files:**
- Create: `middleware.ts`
- Test: `tests/middleware.test.ts`

**Interfaces:**
- Next.js `middleware` function
- Public routes: `/`, `/explore`, `/search`, `/library` (read), `/auth/*`, `/api/auth/*`, `/api/tracks*`, `/api/artists*`, `/api/albums*`, `/api/search*`, `/_next/*`, `/api/_next/*`
- Auth-required pages: `/library` (write), `/profile`, `/settings`, `/api/me/*`, `/api/playlists*`
- Auth-required + admin: `/admin/*`
- Unauthenticated page → redirect `/auth/login?next=<path>`
- Unauthenticated API → `401`
- CSRF: mutating routes check `Origin` header matches host; missing/mismatch → `403`
- Security headers applied via `next.config.mjs` (separate task), not middleware

- [ ] **Step 1: Write failing middleware test**

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement `middleware.ts`**

Read `lp_session` cookie, call `getSessionUser` via D1, enforce rules.

- [ ] **Step 4: Run typecheck + tests**

- [ ] **Step 5: Commit**

```bash
git add middleware.ts tests/middleware.test.ts
git commit -m "feat: add Next.js middleware with route protection and CSRF"
```

---

### Task 9: Modify `next.config.mjs` — security headers

**Files:**
- Modify: `next.config.mjs`

**Interfaces:**
- Add `headers()` returning CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

- [ ] **Step 1: Add `headers()` to nextConfig**

- [ ] **Step 2: Run build (next build) to verify headers generate**

- [ ] **Step 3: Commit**

```bash
git add next.config.mjs
git commit -m "feat: add security headers via next.config.mjs"
```

---

### Task 10: Modify `wrangler.jsonc` — remove JWT_SECRET from vars

**Files:**
- Modify: `wrangler.jsonc`

**Interfaces:**
- Remove `JWT_SECRET` from `vars` (it should be a Wrangler secret, not plaintext)
- Keep `JWT_ISSUER`, `TOKEN_TTL_SECONDS`

- [ ] **Step 1: Remove `JWT_SECRET` from vars**

- [ ] **Step 2: Commit**

```bash
git add wrangler.jsonc
git commit -m "feat: move JWT_SECRET to Wrangler secret (remove from vars)"
```

---

### Task 11: Create admin API routes — stats + audit-log

**Files:**
- Create: `app/api/admin/stats/route.ts`
- Create: `app/api/admin/audit-log/route.ts`
- Test: `tests/admin-api-stats.test.ts`

**Interfaces:**
- `GET /api/admin/stats` — require admin role; return `{ users, tracks, playlists, playsToday }`
- `GET /api/admin/audit-log` — require admin role; return paginated audit log entries
- Consumes: `getCurrentUser`, D1 db
- Produces: JSON response

- [ ] **Step 1: Write failing test for stats auth**

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement both routes**

Check `user.role === 'admin'`, query D1 for stats/audit log.

- [ ] **Step 4: Run typecheck + tests**

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/stats/route.ts app/api/admin/audit-log/route.ts tests/admin-api-stats.test.ts
git commit -m "feat: add admin stats and audit-log API routes"
```

---

### Task 12: Create admin API routes — users

**Files:**
- Create: `app/api/admin/users/route.ts`
- Create: `app/api/admin/users/[id]/route.ts`
- Test: `tests/admin-api-users.test.ts`

**Interfaces:**
- `GET /api/admin/users` — list users (paginated)
- `PATCH /api/admin/users/[id]` — promote/suspend/activate (body: `{ role?, status? }`)
- `DELETE /api/admin/users/[id]` — delete user + cascade
- All require `role === 'admin'`

- [ ] **Step 1: Write failing test for user PATCH auth**

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement both routes**

- [ ] **Step 4: Run typecheck + tests**

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/users/route.ts app/api/admin/users/[id]/route.ts tests/admin-api-users.test.ts
git commit -m "feat: add admin users API routes"
```

---

### Task 13: Create admin API routes — tracks + playlists

**Files:**
- Create: `app/api/admin/tracks/route.ts`
- Create: `app/api/admin/tracks/[id]/route.ts`
- Create: `app/api/admin/playlists/route.ts`
- Create: `app/api/admin/playlists/[id]/route.ts`
- Test: `tests/admin-api-tracks.test.ts`

**Interfaces:**
- `GET /api/admin/tracks` — list all tracks
- `PATCH /api/admin/tracks/[id]` — unpublish/publish/edit metadata
- `DELETE /api/admin/tracks/[id]` — delete track
- `GET /api/admin/playlists` — list all playlists
- `PATCH /api/admin/playlists/[id]` — feature/unfeature playlist
- All require `role === 'admin'`

- [ ] **Step 1: Write failing test for track PATCH auth**

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement all four routes**

- [ ] **Step 4: Run typecheck + tests**

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/tracks/route.ts app/api/admin/tracks/[id]/route.ts app/api/admin/playlists/route.ts app/api/admin/playlists/[id]/route.ts tests/admin-api-tracks.test.ts
git commit -m "feat: add admin tracks and playlists API routes"
```

---

### Task 14: Harden existing routes — CSRF + ownership

**Files:**
- Modify: `app/api/auth/register/route.ts`
- Modify: `app/api/auth/login/route.ts`
- Modify: `app/api/me/favorites/route.ts`
- Modify: `app/api/me/history/route.ts`
- Modify: `app/api/me/preferences/route.ts`
- Modify: `app/api/playlists/route.ts`
- Modify: `app/api/playlists/[id]/route.ts`

**Interfaces:**
- Add CSRF `Origin` check to all mutating routes
- Add ownership verification to `/api/playlists/[id]` (playlist.user_id === currentUser.id)
- Add rate limiting to register/login/search

- [ ] **Step 1: Add CSRF helper to lib/server/api.ts**

- [ ] **Step 2: Apply CSRF + ownership to each route**

- [ ] **Step 3: Run typecheck + tests**

- [ ] **Step 4: Commit**

```bash
git add app/api/auth/register/route.ts app/api/auth/login/route.ts app/api/me/favorites/route.ts app/api/me/history/route.ts app/api/me/preferences/route.ts app/api/playlists/route.ts app/api/playlists/[id]/route.ts lib/server/api.ts
git commit -m "feat: harden existing routes with CSRF and ownership checks"
```

---

### Task 15: Wire admin UI to real API

**Files:**
- Modify: `app/admin/dashboard/page.tsx`
- Modify: `app/admin/users/page.tsx`
- Modify: `app/admin/tracks/page.tsx`
- Modify: `app/admin/playlists/page.tsx`
- Modify: `app/admin/analytics/page.tsx`

**Interfaces:**
- Replace mock data with real `fetch` calls to `/api/admin/*`
- Handle `401`/`403` responses (redirect or show error)
- Actions (promote/suspend/delete/unpublish/feature) call real endpoints and show toasts
- Loading and error states

- [ ] **Step 1: Wire dashboard to `/api/admin/stats`**

- [ ] **Step 2: Wire users page to `/api/admin/users` + `[id]` PATCH/DELETE**

- [ ] **Step 3: Wire tracks page to `/api/admin/tracks` + `[id]` PATCH/DELETE**

- [ ] **Step 4: Wire playlists page to `/api/admin/playlists` + `[id]` PATCH**

- [ ] **Step 5: Wire analytics page to `/api/admin/audit-log`**

- [ ] **Step 6: Run typecheck + tests + lint**

- [ ] **Step 7: Commit**

```bash
git add app/admin/dashboard/page.tsx app/admin/users/page.tsx app/admin/tracks/page.tsx app/admin/playlists/page.tsx app/admin/analytics/page.tsx
git commit -m "feat: wire admin UI to real protected API endpoints"
```

---

### Task 16: Full verification

**Files:** none

- [ ] **Step 1: Run lint**

Run: `npm run lint`

Expected: PASS (no new errors)

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: PASS

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS (Next.js build succeeds with middleware + headers)

- [ ] **Step 5: Commit**

```bash
git commit -m "chore: verify Foundation & Security build passes lint, typecheck, tests, build"
```

---

**Self-review complete:** All spec requirements (D1 sessions, CSRF, security headers, KV rate limiting, Wrangler secret, middleware, RBAC, IDOR protection, audit logging, real admin endpoints) are covered by Tasks 1–16. No spec requirement lacks a task.

**Plan complete and saved to `docs/superpowers/plans/2026-11-15-foundation-security.md`.**

Since you already chose **Native execution** earlier, I'll implement every task myself in this session, then do a final review. Does this plan capture what you want, or would you like any changes before I begin implementing?