# Admin Dashboard UI — Design Spec

**Sub-project:** Stream F — Admin Dashboard  
**Status:** Proposed (awaiting approval)  
**Date:** 2026-11-14  
**Related:** Foundation & Security (server RBAC deferred to last phase)

---

## 1. Intent & Scope

Build a responsive administration dashboard at `/admin/*` for managing users, tracks, artists, albums, playlists, settings, and viewing analytics. Reuse the existing Liquid Glass design system and UI primitives (`Glass`, `Artwork`, `Skeleton`, `ToastHost`).

**Client-side admin gating only:** The frontend checks `user.role === 'admin'` (from `libraryStore`). No server-side RBAC, middleware, or admin API routes exist yet — those are deferred to the Foundation & Security phase (last). The admin UI will render empty/placeholder states for data it cannot fetch, and all admin actions are currently no-ops or local-only until server endpoints exist.

**Out of scope (deferred):** Server-side role enforcement, audit logging, R2 uploads, actual data mutation via API, protected admin API routes, middleware route protection.

---

## 2. Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/admin` | Redirect to `/admin/dashboard` | Entry |
| `/admin/dashboard` | Platform analytics overview | Totals, recent activity, storage |
| `/admin/users` | User management | List users, role/status, suspend/delete (placeholder) |
| `/admin/tracks` | Track management | List tracks, edit metadata (placeholder) |
| `/admin/artists` | Artist & album management | List/edit artists and albums (placeholder) |
| `/admin/playlists` | Playlist management | List curate playlists (placeholder) |
| `/admin/settings` | App settings | Feature flags, demo banner, crossfade default (placeholder) |
| `/admin/analytics` | Infrastructure monitoring | Storage, cache, rate-limit stats (placeholder) |

All routes are client components (`"use client"`) since they consume Zustand stores and have no server data yet.

---

## 3. Admin Gating (Client-Side Only)

**File:** `lib/server/admin-helper.ts` (new, client-safe)

```ts
export function isAdminUser(user: User | null): boolean {
  return user?.role === 'admin';
}
```

Used in `AppShell` (sidebar admin link conditionally rendered) and each admin page (guard + redirect to `/` if not admin). The `role` field does not exist on the `User` type yet (Foundation phase adds it to D1), so `isAdminUser` safely returns `false` when `role` is `undefined`.

**Guard component:** `AdminGuard` — wraps admin pages, checks `useLibraryStore((s) => s.user)`, redirects non-admins to `/` with a toast.

---

## 4. Layout

Reuse `AppShell` structure but with an admin-specific sidebar:

- **Desktop:** Collapsible admin sidebar (Dashboard, Users, Tracks, Artists/Albums, Playlists, Settings, Analytics, Log out)
- **Mobile:** Bottom tab bar hides; admin nav in a drawer
- **Persistent player bar** remains visible (audio continues)
- **ToastHost** for admin action feedback

The admin layout does **not** wrap `AppShell` directly (to avoid double player bar). Instead, admin pages render their own shell with a reusable `AdminLayout` component containing sidebar + content area + player bar import from `AppShell`'s player (or a shared `PersistentPlayerBar` extracted).

**Refactor note:** Extract the persistent player bar from `AppShell.tsx` into `components/layout/PersistentPlayerBar.tsx` so both the main app and admin layout can use it without duplicating the player UI.

---

## 5. Pages (Placeholder-First)

Each page follows the same structure:
1. `AdminGuard` + `isAdminUser` check → redirect if not admin
2. Page title + action buttons
3. Data table / cards (empty state if no data)
4. `Skeleton` loading states
5. `ToastHost` for feedback

### Dashboard
- Stat cards: total users, total tracks, total playlists, plays today (all `0`/placeholder)
- Recent activity list (empty)
- "Coming soon: real data after Foundation phase" banner

### Users
- Table: id, email, username, displayName, role (badge), status (badge), createdAt
- Actions per row: Promote to admin / Suspend / Delete (toast confirmation, no-op until server)

### Tracks
- Table: id, title, artist, album, duration, genre, is_available
- Actions: Edit metadata, Unpublish, Delete (placeholder)

### Artists / Albums
- Combined or separate pages listing artists and their albums
- Placeholder edit forms

### Playlists
- Table of playlists with track counts
- Curate / feature toggle (placeholder)

### Settings
- Feature flags: registration open/closed, maintenance mode, demo content banner
- Default crossfade length, featured mood

### Analytics
- Storage used (R2 — placeholder)
- Cache hit rate (KV — placeholder)
- Rate-limit hits (placeholder)

---

## 6. Components (New)

| Component | File | Purpose |
|-----------|------|---------|
| `AdminLayout` | `components/layout/AdminLayout.tsx` | Sidebar + content wrapper for admin routes |
| `AdminGuard` | `components/layout/AdminGuard.tsx` | Redirect non-admins |
| `PersistentPlayerBar` | `components/layout/PersistentPlayerBar.tsx` | Extracted from AppShell |
| `AdminTable` | `components/ui/AdminTable.tsx` | Reusable data table with sorting, row actions |
| `AdminStatCard` | `components/ui/AdminStatCard.tsx` | Glass stat card with number + label |
| `AdminBadge` | `components/ui/AdminBadge.tsx` | Role/status badges |

---

## 7. Files Touched

**New:**
- `components/layout/AdminLayout.tsx`
- `components/layout/AdminGuard.tsx`
- `components/layout/PersistentPlayerBar.tsx` (extracted)
- `components/ui/AdminTable.tsx`
- `components/ui/AdminStatCard.tsx`
- `components/ui/AdminBadge.tsx`
- `lib/server/admin-helper.ts`
- `app/admin/layout.tsx`
- `app/admin/page.tsx` (redirect)
- `app/admin/dashboard/page.tsx`
- `app/admin/users/page.tsx`
- `app/admin/tracks/page.tsx`
- `app/admin/artists/page.tsx`
- `app/admin/playlists/page.tsx`
- `app/admin/settings/page.tsx`
- `app/admin/analytics/page.tsx`

**Modified:**
- `components/layout/AppShell.tsx` — extract player bar, conditionally render admin sidebar link
- `lib/types.ts` — optional `role` and `status` on `User` (additive, backward-compatible)

---

## 8. Design Decisions & Trade-offs

| Decision | Rationale |
|----------|-----------|
| Client-side gating only | Server RBAC is Foundation phase (user's priority: last). Avoids building admin APIs that can't be secured yet. |
| Extract `PersistentPlayerBar` | Both main app and admin need it; avoids duplication. |
| Placeholder-first pages | Admin UI is usable now as a shell; server integration happens in Foundation phase without UI rewrites. |
| Reuse existing primitives | `Glass`, `Skeleton`, `ToastHost`, `Artwork` maintain design consistency with zero new deps. |
| `role` optional on `User` type | Backward-compatible; existing code doesn't break when Foundation adds the D1 column. |

---

## 9. Testing

- Vitest: `isAdminUser` returns `true` when `role === 'admin'`, `false` otherwise (including `undefined`)
- Vitest: `AdminGuard` redirects non-admins (mock router)
- No E2E yet (Playwright deferred to Testing phase)

---

## 10. Compatibility

- Cloudflare Workers: No server code in admin UI yet — pure client components. Compatible.
- Next.js 15 App Router: `"use client"` pages, standard routing.
- TypeScript strict: `role` and `status` optional on `User`.

---

**Approval requested:** Please confirm this spec before I write the implementation plan and begin coding.