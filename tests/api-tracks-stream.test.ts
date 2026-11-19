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
import { GET as streamGET } from "@/app/api/tracks/[id]/stream/route";

const mockResult: any = {
  bind: vi.fn(() => mockResult),
  first: vi.fn(),
  all: vi.fn(),
  run: vi.fn(),
};
const mockDb: any = {
  prepare: vi.fn(() => mockResult),
};

test("stream GET returns 401 for unauthenticated", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);

  const res = await streamGET(new Request("http://localhost/api/tracks/t1/stream"), {
    params: Promise.resolve({ id: "t1" }),
  });
  expect(res.status).toBe(401);
});

test("stream GET returns 404 for missing track", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1", role: "user" } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);
  vi.mocked(mockDb.prepare).mockReturnValue({
    bind: vi.fn(() => mockResult),
    first: vi.fn().mockResolvedValue(null),
  });

  const res = await streamGET(new Request("http://localhost/api/tracks/t1/stream"), {
    params: Promise.resolve({ id: "t1" }),
  });
  expect(res.status).toBe(404);
});