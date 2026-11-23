/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AdminAction } from "../types";

/**
 * Audit log helper.
 *
 * Writes an audit row to the `audit_log` table. Returns an error signal
 * instead of swallowing failures, so callers can detect audit gaps without
 * blocking the user-facing response.
 *
 * Schema (already in migrations/0002.sql):
 *   audit_log(id TEXT PK, user_id TEXT FK->users, action TEXT, target_type TEXT,
 *             target_id TEXT, details TEXT, created_at TEXT)
 */
export async function auditLog(
  db: any,
  args: {
    userId?: string;
    action: AdminAction;
    targetType?: string;
    targetId?: string;
    details?: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  // Validate action against the AdminAction enum
  const validActions: AdminAction[] = [
    "create_user",
    "suspend_user",
    "activate_user",
    "promote_user",
    "delete_user",
    "unpublish_track",
    "publish_track",
    "delete_track",
    "feature_playlist",
    "unfeature_playlist",
  ];
  if (!validActions.includes(args.action)) {
    return { ok: false, error: `Invalid audit action: ${args.action}` };
  }

  // Constrain details to a max length to prevent unbounded free text
  const details = args.details ?? null;
  if (details !== null && details.length > 1000) {
    return { ok: false, error: "audit details exceed 1000 characters" };
  }

  try {
    await db
      .prepare(
        "INSERT INTO audit_log (user_id, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
      )
      .bind(args.userId ?? null, args.action, args.targetType ?? null, args.targetId ?? null, details)
      .run();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Audit insert failed" };
  }
}
