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
import { GET as lyricsOffsetGET } from "@/app/api/tracks/[id]/lyrics-offset/route";
import { PATCH as lyricsOffsetPATCH } from "@/app/api/tracks/[id]/lyrics-offset/route";

const mockResult: any = {
  bind: vi.fn(() => mockResult),
  first: vi.fn().mockResolvedValue({ track_id: "t1", synchronization_offset: 1.5 }),
  run: vi.fn(),
};

const mockDb: any = {
  prepare: vi.fn(() => mockResult),
};

test("lyrics-offset GET returns 401 for unauthenticated", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);

  const res = await lyricsOffsetGET(
    new Request("http://localhost/api/tracks/t1/lyrics-offset"),
    { params: Promise.resolve({ id: "t1" }) },
  );
  expect(res.status).toBe(401);
});

test("lyrics-offset GET returns 403 for non-admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1", role: "user" } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);

  const res = await lyricsOffsetGET(
    new Request("http://localhost/api/tracks/t1/lyrics-offset"),
    { params: Promise.resolve({ id: "t1" }) },
  );
  expect(res.status).toBe(403);
});

test("lyrics-offset GET returns 200 for admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "u2", role: "admin" } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);
  vi.mocked(mockDb.prepare).mockReturnValue({
    bind: vi.fn(() => mockResult),
    first: vi.fn().mockResolvedValue({ track_id: "t1", synchronization_offset: 1.5 }),
  });

  const res = await lyricsOffsetGET(
    new Request("http://localhost/api/tracks/t1/lyrics-offset"),
    { params: Promise.resolve({ id: "t1" }) },
  );
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.track_id).toBe("t1");
  expect(data.offset).toBe(1.5);
});

test("lyrics-offset PATCH returns 403 for non-admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1", role: "user" } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);

  const res = await lyricsOffsetPATCH(
    new Request("http://localhost/api/tracks/t1/lyrics-offset", {
      method: "PATCH",
      body: JSON.stringify({ offset: 1.5 }),
    }),
    { params: Promise.resolve({ id: "t1" }) },
  );
  expect(res.status).toBe(403);
});

test("lyrics-offset PATCH returns 200 for admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "u2", role: "admin" } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);
  vi.mocked(mockDb.prepare).mockReturnValue({
    bind: vi.fn(() => mockResult),
    first: vi.fn().mockResolvedValue({ track_id: "t1", synchronization_offset: 0 }),
    run: vi.fn(),
  });

  const res = await lyricsOffsetPATCH(
    new Request("http://localhost/api/tracks/t1/lyrics-offset", {
      method: "PATCH",
      body: JSON.stringify({ offset: 1.5 }),
    }),
    { params: Promise.resolve({ id: "t1" }) },
  );
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.track_id).toBe("t1");
  expect(data.offset).toBe(1.5);
});