import { Injectable, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

const developmentDatabaseUrl = 'postgresql://mis_servicios:mis_servicios@127.0.0.1:54329/mis_servicios';

/**
 * Resolved on call, never at import: the integration suite sets DATABASE_URL in
 * `beforeAll`, which runs after this module is imported. A module-level constant
 * would capture the default and point the specs at the development database.
 */
export function resolveDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? developmentDatabaseUrl;
}

/**
 * One pool for the whole process. Each service used to build its own, so a
 * six-service process opened up to six times the configured connection budget
 * against a database that charges for every one of them.
 */
@Injectable()
export class DatabasePool implements OnModuleDestroy {
  private readonly pool = new pg.Pool({
    connectionString: resolveDatabaseUrl(),
    max: configuredPositiveInteger('DB_POOL_MAX', 10),
    idleTimeoutMillis: configuredPositiveInteger('DB_IDLE_TIMEOUT_MS', 30_000),
    connectionTimeoutMillis: configuredPositiveInteger('DB_CONNECTION_TIMEOUT_MS', 5_000),
    keepAlive: true,
  });

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  query<R extends pg.QueryResultRow = pg.QueryResultRow>(text: string, values?: unknown[]): Promise<pg.QueryResult<R>> {
    return this.pool.query<R>(text, values);
  }

  connect(): Promise<pg.PoolClient> {
    return this.pool.connect();
  }
}

function configuredPositiveInteger(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}
