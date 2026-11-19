/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Audit log helper.
 *
 * Writes an audit row to the `audit_log` table. Fire-and-forget: never throws,
 * never blocks the caller response. Schema already in migrations/0002.sql:
 *   audit_log(id TEXT PK, user_id TEXT FK->users, action TEXT, target_type TEXT,
 *             target_id TEXT, details TEXT, created_at TEXT)
 */
export async function auditLog(
  db: any,
  args: {
    userId?: string;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: string;
  },
): Promise<void> {
  try {
    await db
      .prepare(
        "INSERT INTO audit_log (user_id, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
      )
      .bind(args.userId ?? null, args.action, args.targetType ?? null, args.targetId ?? null, args.details ?? null)
      .run();
  } catch {
    // Swallow all errors — audit logging must never block user-facing responses
  }
}
