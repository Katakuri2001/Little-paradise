import { expect, test } from "vitest";
import {
  createSession,
  getSessionUser,
  deleteSession,
  revokeUserSessions,
} from "@/lib/server/session-store";
import type { User } from "@/lib/types";

const mockUser: User = {
  id: "u1",
  email: "user@example.com",
  username: "user",
  displayName: "User One",
  avatarSeed: 1,
  createdAt: "2026-01-01",
};

// Minimal mock D1 database for session store tests
function makeMockDb(user: User | null = mockUser): any {
  const sessions: Record<string, string> = {};
  const prepared: Record<string, any> = {};

  return {
    prepare: (sql: string) => {
      if (prepared[sql]) return prepared[sql];

      const p: any = {
        bind: (...args: any[]) => {
          p.args = args;
          return p;
        },
        run: async () => {
          const insertMatch = sql.match(
            /INSERT INTO sessions \(token, user_id, expires_at, created_at\) VALUES \(\?, \?, \?, \?\)/,
          );
          if (insertMatch) {
            const [token, userId, expiresAt, createdAt] = p.args;
            sessions[token] = JSON.stringify({
              token,
              user_id: userId,
              expires_at: expiresAt,
              created_at: createdAt,
            });
          }
          const deleteTokenMatch = sql.match(/DELETE FROM sessions WHERE token = \?/);
          if (deleteTokenMatch) {
            const [token] = p.args;
            delete sessions[token];
          }
          const deleteUserMatch = sql.match(/DELETE FROM sessions WHERE user_id = \?/);
          if (deleteUserMatch) {
            const [userId] = p.args;
            for (const [token, val] of Object.entries(sessions)) {
              const parsed = JSON.parse(val);
              if (parsed.user_id === userId) {
                delete sessions[token];
              }
            }
          }
          return { success: true, meta: { changes: 1 } };
        },
        first: async () => {
          const selectTokenMatch = sql.match(/SELECT \* FROM sessions WHERE token = \?/);
          if (selectTokenMatch) {
            const [token] = p.args;
            const val = sessions[token];
            return val ? JSON.parse(val) : null;
          }
          const selectUserMatch = sql.match(/SELECT \* FROM users WHERE id = \?/);
          if (selectUserMatch) {
            const [userId] = p.args;
            return user && user.id === userId ? user : null;
          }
          return null;
        },
        all: async () => {
          const selectUserMatch = sql.match(/SELECT \* FROM sessions WHERE user_id = \?/);
          if (selectUserMatch) {
            const [userId] = p.args;
            return Object.values(sessions)
              .map((v) => JSON.parse(v))
              .filter((parsed: any) => parsed.user_id === userId);
          }
          return [];
        },
      };
      prepared[sql] = p;
      return p;
    },
  };
}

test("createSession returns a token and stores it", async () => {
  const db = makeMockDb();
  const token = await createSession(db, "u1");
  expect(typeof token).toBe("string");
  expect(token.length).toBeGreaterThan(10);
});

test("getSessionUser resolves user from valid token", async () => {
  const db = makeMockDb(mockUser);
  const token = await createSession(db, "u1");
  const user = await getSessionUser(db, token);
  expect(user).not.toBeNull();
  expect(user!.id).toBe("u1");
  expect(user!.email).toBe("user@example.com");
});

test("getSessionUser returns null for invalid token", async () => {
  const db = makeMockDb(mockUser);
  const user = await getSessionUser(db, "nonexistent-token");
  expect(user).toBeNull();
});

test("deleteSession removes the token", async () => {
  const db = makeMockDb(mockUser);
  const token = await createSession(db, "u1");
  await deleteSession(db, token);
  const user = await getSessionUser(db, token);
  expect(user).toBeNull();
});

test("revokeUserSessions removes all sessions for a user", async () => {
  const db = makeMockDb(mockUser);
  await createSession(db, "u1");
  await createSession(db, "u1");
  await createSession(db, "u2");
  await revokeUserSessions(db, "u1");
  const all = await db.prepare("SELECT * FROM sessions WHERE user_id = ?").bind("u1").all();
  expect(all).toEqual([]);
});
