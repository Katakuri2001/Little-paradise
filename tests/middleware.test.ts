import { expect, test } from "vitest";
import { processRequest } from "@/lib/server/middleware";
import type { User } from "@/lib/types";

const mockUser: User = {
  id: "u1",
  email: "user@example.com",
  username: "user",
  displayName: "User One",
  avatarSeed: 1,
  createdAt: "2026-01-01",
};

const mockAdmin: User = {
  ...mockUser,
  id: "u2",
  email: "admin@example.com",
  username: "admin",
  role: "admin",
};

// Helper to create a mock D1 database
function makeMockDb(user: User | null): any {
  return {
    prepare: (sql: string) => ({
      bind: (...args: any[]) => ({
        first: async () => {
          if (sql.includes("sessions WHERE token")) {
            const token = args[0];
            if (token === "valid-token" && user) {
              return { token, user_id: user.id, expires_at: new Date(Date.now() + 86400000).toISOString() };
            }
            return null;
          }
          if (sql.includes("users WHERE id")) {
            const id = args[0];
            return user && user.id === id ? user : null;
          }
          return null;
        },
        run: async () => ({ success: true }),
      }),
    }),
  };
}

test("public paths are accessible without session", async () => {
  const db = makeMockDb(null);
  const result = await processRequest("/", "GET", null, null, null, db);
  expect(result.action).toBe("allow");

  const result2 = await processRequest("/explore", "GET", null, null, null, db);
  expect(result2.action).toBe("allow");

  const result3 = await processRequest("/api/tracks", "GET", null, null, null, db);
  expect(result3.action).toBe("allow");
});

test("auth-required paths redirect to login without session", async () => {
  const db = makeMockDb(null);
  const result = await processRequest("/library", "GET", null, null, null, db);
  expect(result.action).toBe("redirect");
  const redirectUrl = (result as { action: string; url: string }).url;
  expect(redirectUrl).toContain("/auth/login");
  expect(redirectUrl).toContain("library");

  const result2 = await processRequest("/api/me", "GET", null, null, null, db);
  expect(result2.action).toBe("respond");
  const resp = (result2 as { action: string; response: Response }).response;
  expect(resp.status).toBe(401);
});

test("admin paths require admin role", async () => {
  const db = makeMockDb(mockUser);
  const token = "valid-token";
  
  // Regular user accessing admin page -> 403
  const result = await processRequest("/admin/dashboard", "GET", token, null, null, db);
  expect(result.action).toBe("respond");
  const resp = (result as { action: string; response: Response }).response;
  expect(resp.status).toBe(403);

  // Admin user accessing admin page -> allowed
  const adminDb = makeMockDb(mockAdmin);
  const result2 = await processRequest("/admin/dashboard", "GET", token, null, null, adminDb);
  expect(result2.action).toBe("allow");
});

test("CSRF protection blocks mutating requests without matching Origin", async () => {
  const db = makeMockDb(mockUser);
  const token = "valid-token";
  
  // POST without Origin header -> 403
  const result = await processRequest("/api/me/favorites", "POST", token, null, null, db);
  expect(result.action).toBe("respond");
  const resp = (result as { action: string; response: Response }).response;
  expect(resp.status).toBe(403);

  // POST with matching Origin -> allowed
  const result2 = await processRequest("/api/me/favorites", "POST", token, "http://localhost:3000", "localhost:3000", db);
  expect(result2.action).toBe("allow");

  // GET requests don't need CSRF
  const result3 = await processRequest("/api/me/favorites", "GET", token, null, null, db);
  expect(result3.action).toBe("allow");
});
