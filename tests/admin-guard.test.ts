import { expect, test } from "vitest";
import AdminGuard from "@/components/layout/AdminGuard";
import { isAdminUser } from "@/lib/server/admin-helper";

test("AdminGuard is a React component (function)", () => {
  expect(typeof AdminGuard).toBe("function");
});

test("isAdminUser returns true for admin role", () => {
  expect(isAdminUser({ role: "admin" } as any)).toBe(true);
});

test("isAdminUser returns false for user role", () => {
  expect(isAdminUser({ role: "user" } as any)).toBe(false);
});

test("isAdminUser returns false for undefined role", () => {
  expect(isAdminUser({} as any)).toBe(false);
});

test("isAdminUser returns false for null", () => {
  expect(isAdminUser(null)).toBe(false);
});
