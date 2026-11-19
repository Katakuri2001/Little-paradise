import { expect, test, vi } from "vitest";

vi.mock("@/lib/server/auth-helper", () => ({
  getCurrentUser: vi.fn(),
}));
vi.mock("@/lib/server/db", () => ({
  getDB: vi.fn(),
  getDBWithDemoData: vi.fn(),
}));

import { getCurrentUser } from "@/lib/server/auth-helper";
import { getDB, getDBWithDemoData } from "@/lib/server/db";
import { GET as usersGET } from "@/app/api/admin/users/route";
import { PATCH as usersIdPATCH, DELETE as usersIdDELETE } from "@/app/api/admin/users/[id]/route";

const mockDb: any = {
  prepare: vi.fn(() => {
    const obj = {
      bind: vi.fn(() => obj),
      first: vi.fn().mockResolvedValue({ count: 5 }),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn(),
    };
    return obj;
  }),
};

test("users GET returns 401 for unauthenticated", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  vi.mocked(getDB).mockReturnValue(mockDb);

  const res = await usersGET();
  expect(res.status).toBe(401);
});

test("users GET returns 403 for non-admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u1",
    role: "user",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);

  const res = await usersGET();
  expect(res.status).toBe(403);
});

test("users GET returns 200 for admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u2",
    role: "admin",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);

  const res = await usersGET();
  expect(res.status).toBe(200);
});

test("users/[id] PATCH returns 403 for non-admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u1",
    role: "user",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);

  const res = await usersIdPATCH(
    new Request("http://localhost/api/admin/users/u2", {
      method: "PATCH",
      body: JSON.stringify({ role: "admin" }),
    }),
    { params: Promise.resolve({ id: "u2" }) },
  );
  expect(res.status).toBe(403);
});

test("users/[id] PATCH returns 200 for admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u2",
    role: "admin",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);

  const res = await usersIdPATCH(
    new Request("http://localhost/api/admin/users/u2", {
      method: "PATCH",
      body: JSON.stringify({ role: "admin" }),
    }),
    { params: Promise.resolve({ id: "u2" }) },
  );
  expect(res.status).toBe(200);
});

test("users/[id] DELETE returns 403 for non-admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u1",
    role: "user",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);

  const res = await usersIdDELETE(
    new Request("http://localhost/api/admin/users/u2"),
    { params: Promise.resolve({ id: "u2" }) },
  );
  expect(res.status).toBe(403);
});

test("users/[id] DELETE returns 200 for admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u2",
    role: "admin",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);

  const res = await usersIdDELETE(
    new Request("http://localhost/api/admin/users/u2"),
    { params: Promise.resolve({ id: "u2" }) },
  );
  expect(res.status).toBe(200);
});
