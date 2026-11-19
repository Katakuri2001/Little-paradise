import { expect, test } from "vitest";
import { withTransaction } from "@/lib/server/transactions";

test("withTransaction executes fn within a batch and resolves", async () => {
  const executed: string[] = [];
  const db = {
    batch: (stmts: unknown[]) => {
      executed.push("batch");
      return Promise.resolve(stmts);
    },
  } as unknown as { batch: (stmts: unknown[]) => Promise<unknown[]> };

  let txSql: string[] = [];
  await withTransaction(db as any, (tx) => {
    txSql.push("prepared");
    tx.prepare("INSERT INTO audit_log (id, action) VALUES (?, ?)").bind("a1", "test");
    return Promise.resolve();
  });

  expect(executed).toContain("batch");
  expect(txSql).toContain("prepared");
});
