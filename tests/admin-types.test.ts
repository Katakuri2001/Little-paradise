import { expect, test } from "vitest";
import type { User } from "@/lib/types";

test("User type accepts role and status fields", () => {
  const adminUser: User = {
    id: "u1",
    email: "admin@example.com",
    username: "admin",
    displayName: "Admin",
    avatarSeed: 1,
    createdAt: "2026-01-01T00:00:00Z",
    role: "admin",
    status: "active",
  };

  expect(adminUser.role).toBe("admin");
  expect(adminUser.status).toBe("active");
});
