import { expect, test } from "vitest";
import { auditLog } from "@/lib/server/audit-log";

test("auditLog inserts a row and never throws", async () => {
  const db: any = {
    prepare: (sql: string) => {
      return {
        bind: (...args: any[]) => ({
          run: async () => ({ success: true }),
        }),
      };
    },
  };

  // Should return { ok: true } on success
  await expect(
    auditLog(db, {
      userId: "u1",
      action: "create_user",
      targetType: "user",
      targetId: "u2",
      details: '{"email":"x@y.com"}',
    }),
  ).resolves.toEqual({ ok: true });
});

test("auditLog handles DB errors gracefully", async () => {
  const db: any = {
    prepare: () => {
      throw new Error("DB connection failed");
    },
  };

  // Should return { ok: false, error } on DB failure
  await expect(
    auditLog(db, {
      userId: "u1",
      action: "delete_track",
      targetType: "track",
      targetId: "t1",
      details: '{"reason":"copyright"}',
    }),
  ).resolves.toEqual({ ok: false, error: "DB connection failed" });
});
