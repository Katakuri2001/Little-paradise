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

  // Should not throw even if DB fails
  await expect(
    auditLog(db, {
      userId: "u1",
      action: "create_user",
      targetType: "user",
      targetId: "u2",
      details: '{"email":"x@y.com"}',
    }),
  ).resolves.toBeUndefined();
});

test("auditLog handles DB errors gracefully", async () => {
  const db: any = {
    prepare: () => {
      throw new Error("DB connection failed");
    },
  };

  await expect(
    auditLog(db, {
      userId: "u1",
      action: "delete_track",
      targetType: "track",
      targetId: "t1",
      details: '{"reason":"copyright"}',
    }),
  ).resolves.toBeUndefined();
});
