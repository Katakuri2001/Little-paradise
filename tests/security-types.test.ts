import { expect, test } from "vitest";
import type { AdminAction, AuditLogEntry } from "@/lib/types";

test("AdminAction type accepts admin actions", () => {
  const a: AdminAction = "create_user";
  expect(a).toBe("create_user");
});

test("AuditLogEntry type shape", () => {
  const entry: AuditLogEntry = {
    id: "log1",
    user_id: "u1",
    action: "create_user",
    target_type: "user",
    target_id: "u2",
    details: '{"email":"x@y.com"}',
    created_at: "2026-01-01",
  };
  expect(entry.action).toBe("create_user");
  expect(entry.user_id).toBe("u1");
});

test("AuditLogEntry allows missing optional fields", () => {
  const entry: AuditLogEntry = {
    id: "log2",
    action: "delete_track",
    created_at: "2026-01-02",
  };
  expect(entry.action).toBe("delete_track");
  expect(entry.user_id).toBeUndefined();
});
