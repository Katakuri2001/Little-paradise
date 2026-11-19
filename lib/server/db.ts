/* eslint-disable @typescript-eslint/no-explicit-any */
// Returns the D1 binding if running on Cloudflare Workers, else null (local dev).
export function getDB(): any | null {
  try {
    // Cloudflare Workers global
    const g = globalThis as any;
    if (g?.DB) return g.DB;
    if (g?.env?.DB) return g.env.DB;
  } catch {
    // ignore
  }
  return null;
}

// Returns the D1 binding with demo data seeded if tables are empty.
// Only used by admin API routes for demonstration purposes.
export async function getDBWithDemoData(): Promise<any | null> {
  const db = getDB();
  if (db) {
    try {
      const { ensureDemoData } = await import("./seed");
      await ensureDemoData(db);
    } catch {
      // Ignore seed errors - tables may already have data or migration not applied
    }
  }
  return db;
}
