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
import { GET as artistsGET } from "@/app/api/admin/artists/route";
import { PATCH as artistsIdPATCH, DELETE as artistsIdDELETE } from "@/app/api/admin/artists/[id]/route";
import { GET as playlistsGET } from "@/app/api/admin/playlists/route";
import { PATCH as playlistsIdPATCH, DELETE as playlistsIdDELETE } from "@/app/api/admin/playlists/[id]/route";

const mockDb: any = {
  prepare: vi.fn(() => {
    const obj = {
      bind: vi.fn(() => obj),
      first: vi.fn(),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn(),
    };
    return obj;
  }),
};

test("artists GET returns 401 for unauthenticated", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  vi.mocked(getDB).mockReturnValue(mockDb);

  const res = await artistsGET();
  expect(res.status).toBe(401);
});

test("artists GET returns 200 for admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u2",
    role: "admin",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);

  const res = await artistsGET();
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.artists).toEqual([]);
});

test("artists/[id] PATCH returns 403 for non-admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u1",
    role: "user",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);

  const res = await artistsIdPATCH(
    new Request("http://localhost/api/admin/artists/a1", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    }),
    { params: Promise.resolve({ id: "a1" }) },
  );
  expect(res.status).toBe(403);
});

test("artists/[id] PATCH returns 200 for admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u2",
    role: "admin",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);

  const res = await artistsIdPATCH(
    new Request("http://localhost/api/admin/artists/a1", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    }),
    { params: Promise.resolve({ id: "a1" }) },
  );
  expect(res.status).toBe(200);
});

test("artists/[id] DELETE returns 403 for non-admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u1",
    role: "user",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);

  const res = await artistsIdDELETE(
    new Request("http://localhost/api/admin/artists/a1"),
    { params: Promise.resolve({ id: "a1" }) },
  );
  expect(res.status).toBe(403);
});

test("artists/[id] DELETE returns 200 for admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u2",
    role: "admin",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);

  const res = await artistsIdDELETE(
    new Request("http://localhost/api/admin/artists/a1"),
    { params: Promise.resolve({ id: "a1" }) },
  );
  expect(res.status).toBe(200);
});

test("playlists GET returns 401 for unauthenticated", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  vi.mocked(getDB).mockReturnValue(mockDb);

  const res = await playlistsGET();
  expect(res.status).toBe(401);
});

test("playlists GET returns 200 for admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u2",
    role: "admin",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);

  const res = await playlistsGET();
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.playlists).toEqual([]);
});

test("playlists/[id] PATCH returns 200 for admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u2",
    role: "admin",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);

  const res = await playlistsIdPATCH(
    new Request("http://localhost/api/admin/playlists/p1", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Playlist" }),
    }),
    { params: Promise.resolve({ id: "p1" }) },
  );
  expect(res.status).toBe(200);
});

test("playlists/[id] DELETE returns 200 for admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u2",
    role: "admin",
  } as any);
  vi.mocked(getDB).mockReturnValue(mockDb);
  vi.mocked(getDBWithDemoData).mockReturnValue(mockDb);

  const res = await playlistsIdDELETE(
    new Request("http://localhost/api/admin/playlists/p1"),
    { params: Promise.resolve({ id: "p1" }) },
  );
  expect(res.status).toBe(200);
});
