import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import pg from 'pg';

const migrationTable = '"_MisServiciosMigration"';

interface MigrationFile {
  id: string;
  path: string;
  sql: string;
  checksum: string;
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error('DATABASE_URL is required to deploy migrations.');

  const migrations = await loadMigrations();
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 1, connectionTimeoutMillis: 10_000 });
  const client = await pool.connect();
  let lockHeld = false;

  try {
    await client.query('SELECT pg_advisory_lock(hashtextextended($1, 0))', ['mis-servicios:migrations']);
    lockHeld = true;
    await client.query(`CREATE TABLE IF NOT EXISTS ${migrationTable} ("id" TEXT PRIMARY KEY, "checksum" TEXT NOT NULL, "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`);

    const applied = await client.query<{ id: string; checksum: string }>(`SELECT "id", "checksum" FROM ${migrationTable}`);
    const appliedById = new Map(applied.rows.map((row) => [row.id, row.checksum]));

    for (const migration of migrations) {
      const previousChecksum = appliedById.get(migration.id);
      if (previousChecksum) {
        if (previousChecksum !== migration.checksum) {
          throw new Error(`Migration ${migration.id} was already applied with a different checksum.`);
        }
        continue;
      }

      console.log(`Applying ${migration.id}...`);
      const containsTransactionControl = /\b(?:BEGIN|COMMIT|ROLLBACK)\s*;/i.test(migration.sql);
      if (!containsTransactionControl) await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(`INSERT INTO ${migrationTable} ("id", "checksum") VALUES ($1, $2)`, [migration.id, migration.checksum]);
        if (!containsTransactionControl) await client.query('COMMIT');
      } catch (error) {
        if (!containsTransactionControl) await client.query('ROLLBACK');
        throw error;
      }
      console.log(`Applied ${migration.id}.`);
    }

    console.log(`Migrations complete (${migrations.length} total).`);
  } finally {
    if (lockHeld) await client.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', ['mis-servicios:migrations']);
    client.release();
    await pool.end();
  }
}

async function loadMigrations(): Promise<MigrationFile[]> {
  const migrationsRoot = await findMigrationsRoot();
  const entries = await readdir(migrationsRoot, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory() && /^\d+_[a-z0-9-]+$/.test(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name));

  return Promise.all(directories.map(async (directory) => {
    const id = directory.name;
    const path = join(migrationsRoot, id, 'migration.sql');
    const sql = await readFile(path, 'utf8');
    return { id, path, sql, checksum: createHash('sha256').update(sql).digest('hex') };
  }));
}

async function findMigrationsRoot(): Promise<string> {
  const compiledFileDirectory = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(process.cwd(), 'apps/api/prisma/migrations'),
    resolve(process.cwd(), 'prisma/migrations'),
    resolve(compiledFileDirectory, '../../prisma/migrations'),
  ];

  for (const candidate of candidates) {
    try {
      await readdir(candidate);
      return candidate;
    } catch {
      // Try the next layout used by local and Railway deployments.
    }
  }
  throw new Error(`Could not find Prisma SQL migrations. Checked: ${candidates.join(', ')}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
