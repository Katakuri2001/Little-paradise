# Admin Dashboard UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive admin dashboard at `/admin/*` with client-side admin gating, reusing the Liquid Glass design system. No server-side RBAC (deferred to Foundation & Security phase).

**Architecture:** Client-side Next.js pages under `app/admin/`, guarded by `AdminGuard` that checks `user.role === 'admin'` from `libraryStore`. Reuses `Glass`, `Skeleton`, `ToastHost`, `Artwork` primitives. `PersistentPlayerBar` extracted from `AppShell` for reuse by both main app and admin layout.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Zustand, Framer Motion

**Spec:** docs/superpowers/specs/2026-11-14-admin-dashboard-ui-design.md

## Global Constraints
- Preserve single AudioEngine architecture (no changes to audio in this plan)
- Client-side admin gating only; no server RBAC, no admin API routes
- Do not remove working features; no duplicate components
- TypeScript strict mode
- Backward-compatible: `role` and `status` optional on `User` type

## Review Focus
1. Non-admin user accesses `/admin/*` — redirects to `/` with toast
2. Admin sidebar link only visible when `isAdminUser()` returns true
3. `role` field undefined on existing users — `isAdminUser` returns false gracefully
4. Player continues playing when navigating to admin routes (single AudioEngine preserved)
5. All admin pages render empty/placeholder states without server data

### Task 1: Add `role` and `status` to `User` type (additive)

**Files:**
- Modify: `lib/types.ts:44-51`

**Interfaces:**
- Consumes: none
- Produces: `User.role?: 'user' | 'admin'`, `User.status?: 'active' | 'suspended'`

- [ ] **Step 1: Write the failing test**

```ts
import type { User } from "@/lib/types";

const u: User = {
  id: "u1", email: "a@b.com", username: "a", displayName: "A", avatarSeed: 1, createdAt: "2026-01-01",
  role: "admin", status: "active",
};
expect(u.role).toBe("admin");
expect(u.status).toBe("active");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run typecheck` (type-level test via a scratch test file, or add to existing test suite)

Expected: TS error — `role`/`status` not on `User` type

- [ ] **Step 3: Add optional `role` and `status` to `User` type in `lib/types.ts`**

```ts
export type User = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarSeed: number;
  createdAt: string;
  role?: "user" | "admin";
  status?: "active" | "suspended";
};
```

- [ ] **Step 4: Run typecheck to verify it passes**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add optional role and status to User type"
```

### Task 2: Create `isAdminUser` helper

**Files:**
- Create: `lib/server/admin-helper.ts`
- Test: `tests/admin-helper.test.ts`

**Interfaces:**
- Consumes: `User | null`
- Produces: `boolean` — `true` when `user?.role === 'admin'`

- [ ] **Step 1: Write the failing test**

```ts
import { isAdminUser } from "@/lib/server/admin-helper";

test("returns true for admin user", () => {
  expect(isAdminUser({ id: "u1", email: "a@b.com", username: "a", displayName: "A", avatarSeed: 1, createdAt: "x", role: "admin" })).toBe(true);
});
test("returns false for regular user", () => {
  expect(isAdminUser({ id: "u1", email: "a@b.com", username: "a", displayName: "A", avatarSeed: 1, createdAt: "x" })).toBe(false);
});
test("returns false for null", () => {
  expect(isAdminUser(null)).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/admin-helper.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement `isAdminUser` in `lib/server/admin-helper.ts`**

```ts
import type { User } from "../types";

export function isAdminUser(user: User | null): boolean {
  return user?.role === "admin";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/admin-helper.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/server/admin-helper.ts tests/admin-helper.test.ts
git commit -m "feat: add isAdminUser helper for client-side admin gating"
```

### Task 3: Extract `PersistentPlayerBar` from `AppShell`

**Files:**
- Create: `components/layout/PersistentPlayerBar.tsx`
- Modify: `components/layout/AppShell.tsx` — remove player bar markup, import and render `PersistentPlayerBar`

**Interfaces:**
- `PersistentPlayerBar` consumes: nothing (reads `playerStore`/`libraryStore` internally)
- Produces: the existing player bar JSX, unchanged behavior

- [ ] **Step 1: Write the failing test**

No unit test (UI component). Verify via `npm run typecheck` and visual inspection.

- [ ] **Step 2: Create `PersistentPlayerBar.tsx`**

Copy the player bar markup (lines ~146-198 of `AppShell.tsx`) into the new component, keeping all store subscriptions and handlers identical.

- [ ] **Step 3: Modify `AppShell.tsx`** to import and render `<PersistentPlayerBar />` in place of the inline markup

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/layout/PersistentPlayerBar.tsx components/layout/AppShell.tsx
git commit -m "refactor: extract PersistentPlayerBar from AppShell"
```

### Task 4: Create `AdminLayout`, `AdminGuard`, and UI primitives

**Files:**
- Create: `components/layout/AdminLayout.tsx`
- Create: `components/layout/AdminGuard.tsx`
- Create: `components/ui/AdminTable.tsx`
- Create: `components/ui/AdminStatCard.tsx`
- Create: `components/ui/AdminBadge.tsx`

**Interfaces:**
- `AdminLayout({ children })`: renders sidebar + content, imports `PersistentPlayerBar`
- `AdminGuard({ children })`: checks `isAdminUser(useLibraryStore((s)=>s.user))`, redirects to `/` if false
- `AdminTable({ columns, rows, actions })`: reusable glass data table
- `AdminStatCard({ value, label, trend })`: glass stat card
- `AdminBadge({ kind, children })`: role/status badge

- [ ] **Step 1: Write the failing test for `AdminGuard`**

Mock `useLibraryStore` and `next/navigation`; verify redirect for non-admin.

- [ ] **Step 2: Create `AdminLayout.tsx`, `AdminGuard.tsx`, `AdminTable.tsx`, `AdminStatCard.tsx`, `AdminBadge.tsx`**

Follow existing `AppShell` styling patterns (glass, Tailwind, lucide-icons).

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/layout/AdminLayout.tsx components/layout/AdminGuard.tsx components/ui/AdminTable.tsx components/ui/AdminStatCard.tsx components/ui/AdminBadge.tsx
git commit -m "feat: add AdminLayout, AdminGuard, and admin UI primitives"
```

### Task 5: Create `/admin` layout and redirect page

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx` (redirect to `/admin/dashboard`)

**Interfaces:**
- `app/admin/layout.tsx`: wraps children in `AdminLayout`, imports `ToastHost`
- `app/admin/page.tsx`: `redirect("/admin/dashboard")` in server component or client-side redirect

- [ ] **Step 1: Create `app/admin/layout.tsx`**

```tsx
import AdminLayout from "@/components/layout/AdminLayout";
import ToastHost from "@/components/ui/ToastHost";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayout>
      {children}
      <ToastHost />
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Create `app/admin/page.tsx`** — redirect to dashboard

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/admin/layout.tsx app/admin/page.tsx
git commit -m "feat: add admin layout and root redirect"
```

### Task 6: Create `/admin/dashboard` page

**Files:**
- Create: `app/admin/dashboard/page.tsx`

**Interfaces:**
- Consumes: none (placeholder data)
- Produces: stat cards (users, tracks, playlists, plays) + recent activity list (empty) + "Foundation phase pending" banner

- [ ] **Step 1: Create dashboard page** with `AdminGuard`, stat cards via `AdminStatCard`, empty-state message

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/admin/dashboard/page.tsx
git commit -m "feat: add admin dashboard page (placeholder)"
```

### Task 7: Create `/admin/users` page

**Files:**
- Create: `app/admin/users/page.tsx`

**Interfaces:**
- Consumes: none (placeholder)
- Produces: user table via `AdminTable`, per-row action buttons (promote/suspend/delete — no-op toasts)

- [ ] **Step 1: Create users page** with `AdminGuard`, table headers (id, email, username, role badge, status badge, createdAt), placeholder rows

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/admin/users/page.tsx
git commit -m "feat: add admin users page (placeholder)"
```

### Task 8: Create `/admin/tracks` page

**Files:**
- Create: `app/admin/tracks/page.tsx`

**Interfaces:**
- Consumes: none (placeholder)
- Produces: track table (id, title, artist, album, duration, genre), action buttons (no-op)

- [ ] **Step 1: Create tracks page** with `AdminGuard`

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/admin/tracks/page.tsx
git commit -m "feat: add admin tracks page (placeholder)"
```

### Task 9: Create `/admin/artists` page

**Files:**
- Create: `app/admin/artists/page.tsx`

**Interfaces:**
- Consumes: none (placeholder)
- Produces: artist/album listing, action buttons (no-op)

- [ ] **Step 1: Create artists page** with `AdminGuard`

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/admin/artists/page.tsx
git commit -m "feat: add admin artists page (placeholder)"
```

### Task 10: Create `/admin/playlists` page

**Files:**
- Create: `app/admin/playlists/page.tsx`

**Interfaces:**
- Consumes: none (placeholder)
- Produces: playlist table, curate/feature toggle (no-op)

- [ ] **Step 1: Create playlists page** with `AdminGuard`

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/admin/playlists/page.tsx
git commit -m "feat: add admin playlists page (placeholder)"
```

### Task 11: Create `/admin/settings` page

**Files:**
- Create: `app/admin/settings/page.tsx`

**Interfaces:**
- Consumes: none (placeholder)
- Produces: feature flags (registration open/closed, maintenance mode, demo banner), default crossfade, featured mood (all no-op toasts)

- [ ] **Step 1: Create settings page** with `AdminGuard`

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/admin/settings/page.tsx
git commit -m "feat: add admin settings page (placeholder)"
```

### Task 12: Create `/admin/analytics` page

**Files:**
- Create: `app/admin/analytics/page.tsx`

**Interfaces:**
- Consumes: none (placeholder)
- Produces: storage, cache hit rate, rate-limit hit cards (all placeholder values)

- [ ] **Step 1: Create analytics page** with `AdminGuard`

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/admin/analytics/page.tsx
git commit -m "feat: add admin analytics page (placeholder)"
```

### Task 13: Add admin sidebar link to `AppShell` (conditionally rendered)

**Files:**
- Modify: `components/layout/AppShell.tsx`

**Interfaces:**
- Consumes: `isAdminUser` from `lib/server/admin-helper`, `user` from `libraryStore`
- Produces: admin sidebar link (Dashboard) shown only when `isAdminUser(user)` is true

- [ ] **Step 1: Modify `AppShell.tsx`** — import `isAdminUser`, read `user` from `libraryStore`, conditionally render `<Link href="/admin">Admin</Link>` in the desktop sidebar nav

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/layout/AppShell.tsx
git commit -m "feat: add conditional admin sidebar link to AppShell"
```

### Task 14: Run full verification

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
git commit -m "chore: verify admin dashboard build passes lint, typecheck, tests"
```

---

**Self-review complete:** All spec requirements (routes, gating, layout, pages, components, files touched, testing, compatibility) are covered by Tasks 1–14. No spec requirement lacks a task.

**Plan complete and saved to `docs/superpowers/plans/2026-11-14-admin-dashboard-ui.md`.**
