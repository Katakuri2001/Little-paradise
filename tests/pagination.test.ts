import { expect, test } from "vitest";
import { encodeCursor, decodeCursor, paginate } from "@/lib/server/pagination";

test("encodeCursor then decodeCursor round-trips", () => {
  const cursor = encodeCursor({ offset: 10, limit: 20 });
  const decoded = decodeCursor(cursor);
  expect(decoded).toEqual({ offset: 10, limit: 20 });
});

test("decodeCursor returns null for invalid input", () => {
  expect(decodeCursor("not-valid-base64")).toBeNull();
  expect(decodeCursor("")).toBeNull();
});

test("paginate returns slice and nextCursor when more items", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const result = paginate(items, undefined, 3);
  expect(result.items).toEqual([1, 2, 3]);
  expect(result.hasMore).toBe(true);
  expect(result.nextCursor).toBeDefined();
});

test("paginate returns hasMore=false when at end", () => {
  const items = [1, 2, 3];
  const result = paginate(items, undefined, 10);
  expect(result.items).toEqual([1, 2, 3]);
  expect(result.hasMore).toBe(false);
  expect(result.nextCursor).toBeUndefined();
});

test("paginate respects cursor offset", () => {
  const items = [1, 2, 3, 4, 5];
  const first = paginate(items, undefined, 2);
  const second = paginate(items, first.nextCursor, 2);
  expect(second.items).toEqual([3, 4]);
  expect(second.hasMore).toBe(true);
});
