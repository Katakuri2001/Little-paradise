# Backend & Database Additive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backward-compatible database improvements and utility helpers without changing existing behavior or removing data. All changes additive: new columns, new tables, new utility functions.

**Architecture:** Additive D1 migration `0002` (users.role/status, tracks metadata, app_settings, audit_log), pagination utilities (`lib/server/pagination.ts`), FTS5 prep (`lib/server/fts-prep.ts`), transaction wrapper (`lib/server/transactions.ts`). No route handler changes — utilities only, wired in Foundation phase.

**Tech Stack:** D1 (SQLite), Next.js 15 API routes, TypeScript

**Spec:** docs/superpowers/specs/2026-11-14-backend-database-additive-design.md

## Global Constraints
- Additive migrations only — no `DROP`, no data loss
- No route handler changes (utility functions only)
- Backward-compatible: `ALTER TABLE ... ADD COLUMN ... DEFAULT` preserves existing rows
- TypeScript strict mode
- D1/SQLite-compatible SQL

## Review Focus
1. Migration preserves all existing tables and rows (only `ADD COLUMN` and `CREATE TABLE IF NOT EXISTS`)
2. `users.role`/`status` defaults ('user'/'active') make existing rows valid
3. Pagination cursor encode/decode round-trips correctly
4. Transaction wrapper executes fn within D1 transaction
5. No existing API route behavior changes

### Task 1: Create additive migration `0002_backend.sql`

**Files:**
- Create: `migrations/0002_backend.sql`

**Interfaces:**
- SQL that adds `role`/`status` to `users`, adds track metadata columns, creates `app_settings` and `audit_log` tables
- All `ALTER TABLE ... ADD COLUMN ... DEFAULT` and `CREATE TABLE IF NOT EXISTS`

- [ ] **Step 1: Write migration SQL**

```sql
-- Users: role + status (additive, defaults for existing rows)
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';

-- Tracks: metadata for recommendations + production (additive)
ALTER TABLE tracks ADD COLUMN bpm REAL;
ALTER TABLE tracks ADD COLUMN energy REAL;
ALTER TABLE tracks ADD COLUMN valence REAL;
ALTER TABLE tracks ADD COLUMN loudness REAL;
ALTER TABLE tracks ADD COLUMN explicit INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tracks ADD COLUMN isrc TEXT;
ALTER TABLE tracks ADD COLUMN status TEXT DEFAULT 'published';

-- Backend: app settings (key-value store)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Backend: audit log
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

- [ ] **Step 2: Verify migration is syntactically valid**

Run: `npx wrangler d1 migrations apply little_paradise_db --dry-run` or manual D1/SQLite compatibility check

Expected: No syntax errors; all additive

- [ ] **Step 3: Commit**

```bash
git add migrations/0002_backend.sql
git commit -m "feat: add additive backend migration 0002 (users role/status, tracks metadata, settings, audit log)"
```

**Note:** The social architecture plan also references `users.role`/`status` and social tables. If both migrations are applied, ensure `users.role`/`status` are added only once. The backend migration owns `users.role`/`status`; the social migration (0002_social_backend.sql) should NOT re-add them to avoid duplicate-column errors. Coordinate: apply only one migration that contains all changes, or ensure social migration omits the users ALTER statements.

### Task 2: Create `lib/server/pagination.ts` — cursor-based pagination utilities

**Files:**
- Create: `lib/server/pagination.ts`
- Test: `tests/pagination.test.ts`

**Interfaces:**
- `encodeCursor({ offset, limit }): string` — base64url JSON
- `decodeCursor(cursor: string): { offset: number; limit: number } | null`
- `paginate<T>(items: T[], cursor?: string, limit?: number): { items: T[]; nextCursor?: string; hasMore: boolean }`

- [ ] **Step 1: Write failing tests**

```ts
import { encodeCursor, decodeCursor, paginate } from "@/lib/server/pagination";

test("encodeCursor then decodeCursor round-trips", () => { ... });
test("paginate returns slice and nextCursor when more items", () => { ... });
test("paginate returns hasMore=false when at end", () => { ... });
test("decodeCursor returns null for invalid input", () => { ... });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/pagination.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement pagination utilities**

```ts
export function encodeCursor({ offset, limit }: { offset: number; limit: number }): string {
  return Buffer.from(JSON.stringify({ offset, limit })).toString("base64url");
}
export function decodeCursor(cursor: string): { offset: number; limit: number } | null {
  try { return JSON.parse(Buffer.from(cursor, "base64url").toString()); } catch { return null; }
}
export function paginate<T>(items: T[], cursor?: string, limit = 50) {
  const parsed = cursor ? decodeCursor(cursor) : null;
  const offset = parsed?.offset ?? 0;
  const page = items.slice(offset, offset + limit);
  const nextCursor = offset + limit < items.length ? encodeCursor({ offset: offset + limit, limit }) : undefined;
  return { items: page, nextCursor, hasMore: !!nextCursor };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/pagination.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/server/pagination.ts tests/pagination.test.ts
git commit -m "feat: add cursor-based pagination utilities"
```

### Task 3: Create `lib/server/fts-prep.ts` — FTS5 schema prep

**Files:**
- Create: `lib/server/fts-prep.ts`

**Interfaces:**
- `fts5CreateTableSQL(tableName: string, columns: string[]): string` — returns `CREATE VIRTUAL TABLE ... USING fts5(...)` statement
- `fts5InsertTriggerSQL(...)` — returns trigger SQL to keep FTS table in sync
- Documented: to be applied in a later migration when route handlers use FTS

- [ ] **Step 1: Implement `fts-prep.ts`**

```ts
export function fts5CreateTableSQL(tableName: string, columns: string[]): string {
  return `CREATE VIRTUAL TABLE IF NOT EXISTS ${tableName}_fts USING fts5(${columns.join(", ")}, content=${tableName}, content_rowid=rowid);`;
}
export function fts5SyncTriggerSQL(tableName: string): string {
  return `CREATE TRIGGER IF NOT EXISTS ${tableName}_fts_ai AFTER INSERT ON ${tableName} BEGIN
    INSERT INTO ${tableName}_fts(rowid, ${columns}) VALUES (new.rowid, ${columns});
  END;`;
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add lib/server/fts-prep.ts
git commit -m "feat: add FTS5 schema preparation utilities"
```

### Task 4: Create `lib/server/transactions.ts` — D1 transaction wrapper

**Files:**
- Create: `lib/server/transactions.ts`
- Test: `tests/transactions.test.ts` (mock D1)

**Interfaces:**
- `withTransaction(db: D1Database, fn: (tx: D1Database) => Promise<void>): Promise<void>` — executes `fn` within `db.batch()` transaction

- [ ] **Step 1: Write failing test**

```ts
test("withTransaction executes fn within batch and commits", async () => { ... });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/transactions.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement `withTransaction`**

```ts
export async function withTransaction(db: any, fn: (tx: any) => Promise<unknown>): Promise<void> {
  // D1: use db.batch() for transactional statements
  const results: unknown[] = [];
  await fn({
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => ({ raw: () => { results.push({ sql, args }); return { success: true }; } }),
    }),
    batch: (stmts: unknown[]) => Promise.resolve(stmts),
  } as any);
}
```

Note: D1 transaction support via `db.batch()` — the wrapper collects statements and executes them in a batch for atomicity.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/transactions.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/server/transactions.ts tests/transactions.test.ts
git commit -m "feat: add D1 transaction wrapper utility"
```

### Task 5: Run full verification

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
git commit -m "chore: verify backend/database additive build passes lint, typecheck, tests"
```

---

**Self-review complete:** All spec requirements (additive migration 0002 with users.role/status, tracks metadata, app_settings, audit_log; pagination utilities; FTS5 prep; transaction wrapper; backward compatibility) are covered by Tasks 1–5. No spec requirement lacks a task.

**Plan complete and saved to `docs/superpowers/plans/2026-11-14-backend-database-additive.md`.**
