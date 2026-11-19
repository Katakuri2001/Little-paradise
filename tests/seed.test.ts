import { expect, test, vi } from "vitest";
import { ensureDemoData } from "@/lib/server/seed";

test("ensureDemoData inserts demo users", async () => {
  const preparedCalls: any[] = [];
  const db: any = {
    prepare: (sql: string) => {
      preparedCalls.push(sql);
      const obj = {
        bind: vi.fn(() => obj),
        first: vi.fn().mockResolvedValue({ count: 0 }),
        all: vi.fn(),
        run: vi.fn(),
      };
      return obj;
    },
  };

  await ensureDemoData(db);

  // Verify users INSERT was called for each demo user
  const insertUserCalls = preparedCalls.filter((sql: string) =>
    sql.includes("INSERT INTO users")
  );
  expect(insertUserCalls.length).toBe(3);
});

test("ensureDemoData does not re-insert if users exist", async () => {
  const preparedCalls: any[] = [];
  const db: any = {
    prepare: (sql: string) => {
      preparedCalls.push(sql);
      const obj = {
        bind: vi.fn(() => obj),
        first: vi.fn().mockResolvedValue({ count: 5 }),
        all: vi.fn(),
        run: vi.fn(),
      };
      return obj;
    },
  };

  await ensureDemoData(db);

  // Should not call INSERT since users already exist
  const insertCalls = preparedCalls.filter((sql: string) =>
    sql.includes("INSERT INTO users")
  );
  expect(insertCalls.length).toBe(0);
});
