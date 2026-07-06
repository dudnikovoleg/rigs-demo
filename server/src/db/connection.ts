import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

let db: Database.Database | undefined;

/**
 * Lazy-init singleton for the SQLite database. Resolves to server/data/rigs.db
 * from both src/ (dev) and dist/ (build). Enables foreign-key enforcement.
 */
export function getDb(): Database.Database {
  if (db) return db;

  try {
    const dataDir = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "data",
    );
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, "rigs.db");
    db = new Database(dbPath);
    db.pragma("foreign_keys = ON");

    const schemaPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "schema.sql",
    );
    const schemaSql = readFileSync(schemaPath, "utf8");
    db.exec(schemaSql);

    return db;
  } catch (err) {
    console.error("Failed to initialize database:", err instanceof Error ? err.message : String(err));
    throw err;
  }
}
