import { Injectable, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

export interface RetentionResult {
  displayNames: number;
  events: number;
  submissions: number;
  abuseRecords: number;
  alertIntents: number;
}

export interface PilotPurgeResult {
  displayNames: number;
  events: number;
  submissions: number;
  abuseRecords: number;
  episodes: number;
}

@Injectable()
export class RetentionService implements OnModuleDestroy {
  private readonly pool = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://mis_servicios:mis_servicios@127.0.0.1:54329/mis_servicios_test' });

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async cleanup(): Promise<RetentionResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const displayNames = await deleteExpired(client, 'ReportDisplayName');
      const events = await deleteExpired(client, 'ReportEvent');
      const submissions = await deleteExpired(client, 'SubmissionRecord');
      const abuseRecords = await deleteExpired(client, 'AbuseRecord');
      const alertIntents = await client.query('DELETE FROM "AlertIntent" WHERE "createdAt" <= CURRENT_TIMESTAMP - INTERVAL \'30 days\'');
      await client.query('COMMIT');
      return { displayNames, events, submissions, abuseRecords, alertIntents: alertIntents.rowCount ?? 0 };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async purgePilotData(): Promise<PilotPurgeResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const displayNames = await deleteAll(client, 'ReportDisplayName');
      const events = await deleteAll(client, 'ReportEvent');
      const submissions = await deleteAll(client, 'SubmissionRecord');
      const abuseRecords = await deleteAll(client, 'AbuseRecord');
      const episodes = await deleteAll(client, 'OutageEpisode');
      await client.query('COMMIT');
      return { displayNames, events, submissions, abuseRecords, episodes };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export function startRetentionWorker(retention: RetentionService): NodeJS.Timeout {
  const run = (): void => { void retention.cleanup().catch(() => undefined); };
  run();
  const timer = setInterval(run, 60 * 60 * 1000);
  timer.unref();
  return timer;
}

async function deleteExpired(client: pg.PoolClient, table: 'ReportDisplayName' | 'ReportEvent' | 'SubmissionRecord' | 'AbuseRecord'): Promise<number> {
  const result = await client.query(`DELETE FROM "${table}" WHERE "expiresAt" <= CURRENT_TIMESTAMP`);
  return result.rowCount ?? 0;
}

async function deleteAll(client: pg.PoolClient, table: 'ReportDisplayName' | 'ReportEvent' | 'SubmissionRecord' | 'AbuseRecord' | 'OutageEpisode'): Promise<number> {
  const result = await client.query(`DELETE FROM "${table}"`);
  return result.rowCount ?? 0;
}
