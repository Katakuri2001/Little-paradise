# Backend & Database — Additive Migrations & Utilities Spec

**Sub-project:** Stream G — Backend & Database (non-breaking)  
**Status:** Proposed (awaiting approval)  
**Date:** 2026-11-14  
**Related:** Foundation & Security (D1 sessions, rate limiting, middleware deferred to last phase)

---

## 1. Intent & Scope

Add backward-compatible database improvements and utility helpers without changing existing behavior or removing data. All changes are additive (new columns, new tables, new utility functions).

**Out of scope:** Migrating dev from in-memory to D1, cursor pagination on routes (utility only), FTS5 on route handlers, KV caching in routes, transactions on route handlers — those require Foundation/backend work and are deferred.

---

## 2. Additive Migration `0002_backend.sql`

```sql
-- Users: role + status (additive, shared with social spec — defined once here)
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';

-- Tracks: metadata for recommendations + production
ALTER TABLE tracks ADD COLUMN bpm REAL;
ALTER TABLE tracks ADD COLUMN energy REAL;
ALTER TABLE tracks ADD COLUMN valence REAL;
ALTER TABLE tracks ADD COLUMN loudness REAL;
ALTER TABLE tracks ADD COLUMN explicit INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tracks ADD COLUMN isrc TEXT;
ALTER TABLE tracks ADD COLUMN status TEXT DEFAULT 'published';

-- App settings (key-value store for admin)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_tracks_status ON tracks(status);
CREATE INDEX IF NOT EXISTS idx_tracks_bpm ON tracks(bpm);
```

**Note:** `users.role` and `users.status` are defined in this migration (not the social one) to avoid duplication. The social spec references the same columns.

---

## 3. Utility Helpers (No Route Changes)

**`lib/server/pagination.ts`:**
- `cursorFromOffset(offset: number, limit: number): string` — base64 cursor
- `parseCursor(cursor: string): { offset, limit }`
- `paginate<T>(items: T[], cursor, limit): { items, nextCursor, hasMore }`

**`lib/server/fts-prep.ts`:**
- Schema comment / helper for FTS5 virtual table creation (to be applied in a later migration when routes use it)

**`lib/server/transactions.ts`:**
- `withTransaction(db, fn)` — D1 transaction wrapper (helper, not yet wired to routes)

---

## 4. Files Touched

**New:**
- `migrations/0002_backend.sql`
- `lib/server/pagination.ts`
- `lib/server/fts-prep.ts`
- `lib/server/transactions.ts`
- `tests/pagination.test.ts`

**Modified:**
- None (all additive)

---

## 5. Design Decisions

| Decision | Rationale |
|----------|-----------|
| Additive only | Zero risk to existing data; can deploy independently |
| Migration `0002` combines backend + social columns | Avoids two migrations touching `users` table; single source of truth |
| Pagination as utility only | Routes don't change yet; Foundation phase will wire them |
| FTS5 prep without route changes | Schema ready; route integration deferred |

---

## 6. Compatibility

- D1: All SQL is SQLite-compatible (D1 dialect).
- Backward compatible: `ALTER TABLE ... ADD COLUMN ... DEFAULT` preserves existing rows.
- Cloudflare Workers: Migration applied via `wrangler d1 migrations apply`.

---

**Approval requested:** Please confirm this spec before implementation.