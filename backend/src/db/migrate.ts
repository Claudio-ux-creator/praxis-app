import { getDb } from './connection.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MIGRATIONS_DIR = path.resolve(__dirname, '../../prisma/migrations');
const META_TABLE = '_prisma_migrations';

export function migrateSchema(): void {
  const db = getDb();

  // Create migration tracking table
  const createMetaSql = 'CREATE TABLE IF NOT EXISTS ' + META_TABLE + ` (
    id TEXT PRIMARY KEY,
    checksum TEXT NOT NULL DEFAULT '',
    finished_at TEXT,
    migration_name TEXT NOT NULL,
    logs TEXT,
    rolled_back_at TEXT,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    applied_steps_count INTEGER NOT NULL DEFAULT 0
  )`;
  db.exec(createMetaSql);

  // Find all migration directories sorted by name
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('Keine Migrationen gefunden.');
    return;
  }

  const migrationDirs = fs.readdirSync(MIGRATIONS_DIR)
    .filter((name) => {
      const fullPath = path.join(MIGRATIONS_DIR, name);
      return fs.statSync(fullPath).isDirectory();
    })
    .sort();

  for (const dirName of migrationDirs) {
    // Skip if already applied
    const existing = db.prepare(
      'SELECT id FROM ' + META_TABLE + ' WHERE id = ? AND finished_at IS NOT NULL'
    ).get(dirName) as { id: string } | undefined;

    if (existing) {
      console.log('Migration ' + dirName + ' bereits ausgefuehrt.');
      continue;
    }

    const migrationFile = path.join(MIGRATIONS_DIR, dirName, 'migration.sql');
    if (!fs.existsSync(migrationFile)) {
      console.warn('Keine migration.sql in ' + dirName + ' gefunden.');
      continue;
    }

    const sql = fs.readFileSync(migrationFile, 'utf-8');

    try {
      db.exec('BEGIN TRANSACTION');

      // Mark as started
      db.prepare(
        "INSERT OR REPLACE INTO " + META_TABLE + " (id, checksum, migration_name, started_at) VALUES (?, '', ?, datetime('now'))"
      ).run(dirName, dirName);

      // Run migration
      db.exec(sql);

      // Mark as finished
      db.prepare(
        "UPDATE " + META_TABLE + " SET finished_at = datetime('now'), applied_steps_count = 1 WHERE id = ?"
      ).run(dirName);

      db.exec('COMMIT');
      console.log('Migration ' + dirName + ' erfolgreich ausgefuehrt.');
    } catch (error) {
      db.exec('ROLLBACK');
      console.error('Fehler bei Migration ' + dirName + ':', error);
      throw error;
    }
  }
}
