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
import { GET as statsGET } from "@/app/api/admin/stats/route";
import { GET as auditLogGET } from "@/app/api/admin/audit-log/route";

const makeMockDb = () => {
  const obj = {
    bind: vi.fn(() => obj),
    first: vi.fn(),
    all: vi.fn(),
    run: vi.fn(),
  };
  return obj;
};

const mockDb: any = {
  prepare: vi.fn(() => makeMockDb()),
};

test("stats returns 401 for unauthenticated", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  vi.mocked(getDB).mockReturnValue(mockDb);

  const res = await statsGET();
  expect(res.status).toBe(401);
});

test("stats returns 403 for non-admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u1",
    role: "user",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);

  const res = await statsGET();
  expect(res.status).toBe(403);
});

test("stats returns 200 for admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u2",
    role: "admin",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);
  vi.mocked(mockDb.prepare).mockReturnValue({
    bind: vi.fn(() => ({
      first: vi.fn().mockResolvedValue({ count: 5 }),
      all: vi.fn(),
      run: vi.fn(),
    })),
    first: vi.fn().mockResolvedValue({ count: 5 }),
    all: vi.fn(),
    run: vi.fn(),
  });

  const res = await statsGET();
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.stats.users).toBe(5);
});

test("audit-log returns 401 for unauthenticated", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  vi.mocked(getDB).mockReturnValue(mockDb);

  const res = await auditLogGET();
  expect(res.status).toBe(401);
});

test("audit-log returns 403 for non-admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u1",
    role: "user",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);

  const res = await auditLogGET();
  expect(res.status).toBe(403);
});

test("audit-log returns 200 for admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u2",
    role: "admin",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);
  vi.mocked(mockDb.prepare).mockReturnValue({
    bind: vi.fn(() => ({
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn(),
    })),
    all: vi.fn().mockResolvedValue({ results: [] }),
    first: vi.fn(),
    run: vi.fn(),
  });

  const res = await auditLogGET();
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.auditLog).toEqual([]);
});
