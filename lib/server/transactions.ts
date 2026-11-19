/**
 * D1 transaction wrapper.
 *
 * Executes `fn` within a `db.batch()` transaction so multiple statements
 * are applied atomically. The `tx` object passed to `fn` exposes a `prepare`
 * method that records statements; they are flushed via `db.batch()` when `fn`
 * resolves.
 */
export async function withTransaction(
  db: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  fn: (tx: { prepare: (sql: string) => any }) => Promise<unknown>, // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<void> {
  const statements: Array<{ sql: string; bindArgs: unknown[] }> = [];

  const tx = {
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => {
        statements.push({ sql, bindArgs: args });
        return {
          run: () => {},
          all: () => [],
          first: () => null,
          raw: () => ({ success: true }),
        };
      },
    }),
  };

  await fn(tx);

  if (statements.length > 0) {
    await db.batch(
      statements.map((s) => ({
        sql: s.sql,
        args: s.bindArgs,
      })),
    );
  }
}
