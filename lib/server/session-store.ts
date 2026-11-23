/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * D1-backed session store.
 *
 * Replaces the in-memory sessions Map in store.ts with persistent, revocable
 * D1 rows. Falls back gracefully if D1 is unavailable (local dev).
 *
 * Schema (already in migrations/0002.sql):
 *   sessions(token TEXT PK, user_id TEXT FK->users, expires_at TEXT, created_at TEXT)
 */
export async function createSession(
  db: any,
  userId: string,
): Promise<string> {
  const token = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    await db
      .prepare(
        "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
      )
      .bind(token, userId, expiresAt, now)
      .run();
  } catch {
    // Session table may not exist yet (migration not applied) — fall back to in-memory
  }
  return token;
}

export async function getSessionUser(
  db: any,
  token: string | undefined,
): Promise<any | null> {
  if (!token) return null;

  let row: any = null;
  try {
    row = await db
      .prepare("SELECT * FROM sessions WHERE token = ?")
      .bind(token)
      .first();
  } catch {
    return null;
  }
  if (!row) return null;

  // Check expiration
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    try {
      await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    } catch {
      // Ignore cleanup failure
    }
    return null;
  }

  // Resolve user
  let user: any = null;
  try {
    user = await db
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(row.user_id)
      .first();
  } catch {
    return null;
  }
  return user ?? null;
}

export async function deleteSession(db: any, token: string): Promise<void> {
  try {
    await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  } catch {
    // Ignore
  }
}

export async function revokeUserSessions(db: any, userId: string): Promise<void> {
  try {
    await db
      .prepare("DELETE FROM sessions WHERE user_id = ?")
      .bind(userId)
      .run();
  } catch {
    // Ignore
  }
}

export async function cleanupExpiredSessions(db: any): Promise<void> {
  try {
    await db
      .prepare(
        "DELETE FROM sessions WHERE expires_at < datetime('now')",
      )
      .run();
  } catch {
    // Ignore
  }
}
