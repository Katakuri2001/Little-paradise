import { expect, test, vi } from "vitest";

vi.mock("@/lib/server/auth-helper", () => ({
  getCurrentUser: vi.fn(),
}));
vi.mock("@/lib/server/db", () => ({
  getDB: vi.fn(),
  getDBWithDemoData: vi.fn(),
}));

import { getCurrentUser } from "@/lib/server/auth-helper";
import { getDB } from "@/lib/server/db";
import { POST as uploadsPOST } from "@/app/api/admin/uploads/route";

const mockR2 = {
  put: vi.fn(),
};

const mockDb = {
  prepare: vi.fn(() => {
    const obj = {
      bind: vi.fn(() => obj),
      first: vi.fn(),
      all: vi.fn(),
      run: vi.fn(),
    };
    return obj;
  }),
};

test("uploads POST returns 401 for unauthenticated", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  vi.mocked(getDB).mockReturnValue(null);

  const res = await uploadsPOST(
    new Request("http://localhost/api/admin/uploads", {
      method: "POST",
      body: JSON.stringify({ filename: "test.mp3", contentType: "audio/mpeg" }),
    })
  );
  expect(res.status).toBe(401);
});

test("uploads POST returns 403 for non-admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u1",
    role: "user",
  } as any);
  vi.mocked(getDB).mockReturnValue(null);

  const res = await uploadsPOST(
    new Request("http://localhost/api/admin/uploads", {
      method: "POST",
      body: JSON.stringify({ filename: "test.mp3", contentType: "audio/mpeg" }),
    })
  );
  expect(res.status).toBe(403);
});

test("uploads POST returns 200 with upload info for admin", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u2",
    role: "admin",
  } as any);
  vi.mocked(getDB).mockReturnValue(null);

  const res = await uploadsPOST(
    new Request("http://localhost/api/admin/uploads", {
      method: "POST",
      body: JSON.stringify({ filename: "test.mp3", contentType: "audio/mpeg" }),
    })
  );
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.key).toBeDefined();
  expect(data.bucket).toBe("little-paradise-assets");
  expect(data.uploadUrl).toBeDefined();
});
