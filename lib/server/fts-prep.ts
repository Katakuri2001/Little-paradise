/**
 * FTS5 schema preparation utilities.
 *
 * These helpers generate D1/SQLite FTS5 virtual table and trigger SQL.
 * They are intended to be applied in a later migration once route handlers
 * are wired to use full-text search. No migration is applied here — this is
 * schema preparation only.
 */

/**
 * Returns a CREATE VIRTUAL TABLE ... USING fts5 statement for the given table.
 * The FTS table shadows `tableName` and stays in sync via triggers.
 */
export function fts5CreateTableSQL(tableName: string, columns: string[]): string {
  const cols = columns.join(", ");
  return `CREATE VIRTUAL TABLE IF NOT EXISTS ${tableName}_fts USING fts5(${cols}, content=${tableName}, content_rowid=rowid);`;
}

/**
 * Returns an AFTER INSERT trigger SQL to populate the FTS table when a row is added.
 */
export function fts5InsertTriggerSQL(tableName: string, columns: string[]): string {
  const cols = columns.join(", ");
  const newCols = columns.map((c) => `new.${c}`).join(", ");
  return `
CREATE TRIGGER IF NOT EXISTS ${tableName}_fts_ai AFTER INSERT ON ${tableName} BEGIN
  INSERT INTO ${tableName}_fts(rowid, ${cols}) VALUES (new.rowid, ${newCols});
END;
`;
}

/**
 * Returns an AFTER DELETE trigger SQL to remove rows from the FTS table.
 */
export function fts5DeleteTriggerSQL(tableName: string, columns: string[]): string {
  const cols = columns.join(", ");
  const oldCols = columns.map((c) => `old.${c}`).join(", ");
  return `
CREATE TRIGGER IF NOT EXISTS ${tableName}_fts_ad AFTER DELETE ON ${tableName} BEGIN
  INSERT INTO ${tableName}_fts(${tableName}_fts, rowid, ${cols}) VALUES('delete', old.rowid, ${oldCols});
END;
`;
}

/**
 * Returns an AFTER UPDATE trigger SQL to keep the FTS table in sync on updates.
 */
export function fts5UpdateTriggerSQL(tableName: string, columns: string[]): string {
  const cols = columns.join(", ");
  const oldCols = columns.map((c) => `old.${c}`).join(", ");
  const newCols = columns.map((c) => `new.${c}`).join(", ");
  return `
CREATE TRIGGER IF NOT EXISTS ${tableName}_fts_au AFTER UPDATE ON ${tableName} BEGIN
  INSERT INTO ${tableName}_fts(${tableName}_fts, rowid, ${cols}) VALUES('delete', old.rowid, ${oldCols});
  INSERT INTO ${tableName}_fts(rowid, ${cols}) VALUES (new.rowid, ${newCols});
END;
`;
}
