import { expect, test } from "vitest";
import { isAdminUser } from "@/lib/server/admin-helper";

const baseUser = (overrides: Partial<{ role: "user" | "admin" }> = {}) => ({
  id: "u1",
  email: "a@b.com",
  username: "a",
  displayName: "A",
  avatarSeed: 1,
  createdAt: "2026-01-01",
  ...overrides,
});

test("returns true for admin user", () => {
  expect(isAdminUser(baseUser({ role: "admin" }))).toBe(true);
});

test("returns false for regular user", () => {
  expect(isAdminUser(baseUser({ role: "user" }))).toBe(false);
});

test("returns false when role is undefined", () => {
  expect(isAdminUser(baseUser({}))).toBe(false);
});

test("returns false for null", () => {
  expect(isAdminUser(null)).toBe(false);
});

test("returns false for undefined", () => {
  expect(isAdminUser(undefined as unknown as null)).toBe(false);
});
