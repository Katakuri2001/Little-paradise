import { expect, test } from "vitest";
import { getSessionCookieOptions } from "@/lib/server/auth-helper";

test("secure flag is true in production", () => {
  const opts = getSessionCookieOptions("tok", "production");
  expect(opts.secure).toBe(true);
});

test("secure flag is false in development", () => {
  const opts = getSessionCookieOptions("tok", "development");
  expect(opts.secure).toBe(false);
});

test("secure flag is true in preview", () => {
  const opts = getSessionCookieOptions("tok", "preview");
  expect(opts.secure).toBe(true);
});

test("cookie options include httpOnly, sameSite, path, maxAge", () => {
  const opts = getSessionCookieOptions("tok", "production");
  expect(opts.httpOnly).toBe(true);
  expect(opts.sameSite).toBe("lax");
  expect(opts.path).toBe("/");
  expect(opts.maxAge).toBe(60 * 60 * 24 * 7);
});
