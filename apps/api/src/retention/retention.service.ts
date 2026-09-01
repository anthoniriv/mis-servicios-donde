import { Injectable } from '@nestjs/common';
import pg from 'pg';

import type { ScheduledWorker } from '../workers/interval-worker.js';
import { DatabasePool } from '../database/database.pool.js';

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
export class RetentionService {
  constructor(private readonly database: DatabasePool) {}

  async cleanup(): Promise<RetentionResult> {
    const client = await this.database.connect();
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
    const client = await this.database.connect();
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

export const retentionIntervalMs = 24 * 60 * 60 * 1000;

const limaTimeZone = 'America/Lima';

export function millisecondsUntilNextLimaMidnight(now: Date = new Date()): number {
  if (Number.isNaN(now.getTime())) throw new RangeError('Cannot calculate retention schedule from an invalid date.');

  const limaDate = dateParts(now);
  const nextMidnightDate = Date.UTC(limaDate.year, limaDate.month - 1, limaDate.day + 1);
  const offsetAtNextMidnight = timeZoneOffsetMs(new Date(nextMidnightDate + 12 * 60 * 60 * 1000), limaTimeZone);
  const nextMidnight = nextMidnightDate - offsetAtNextMidnight;
  return nextMidnight - now.getTime();
}

export function startRetentionWorker(retention: RetentionService, now: Date = new Date()): ScheduledWorker {
  let stopped = false;
  let timer: NodeJS.Timeout | undefined;

  const schedule = (delayMs: number): void => {
    timer = setTimeout(() => void cycle(), delayMs);
    timer.unref();
  };

  const cycle = async (): Promise<void> => {
    try {
      await retention.cleanup();
    } catch {
      // Swallowed on purpose: the next daily run retries the cleanup.
    }
    if (!stopped) schedule(retentionIntervalMs);
  };

  schedule(millisecondsUntilNextLimaMidnight(now));

  return {
    stop: (): void => {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}

function dateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: limaTimeZone,
    calendar: 'iso8601',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  return { year: numericPart(parts, 'year'), month: numericPart(parts, 'month'), day: numericPart(parts, 'day') };
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'iso8601',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const asUtc = Date.UTC(
    numericPart(parts, 'year'),
    numericPart(parts, 'month') - 1,
    numericPart(parts, 'day'),
    numericPart(parts, 'hour'),
    numericPart(parts, 'minute'),
    numericPart(parts, 'second'),
  );
  return asUtc - date.getTime();
}

function numericPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const value = parts.find((part) => part.type === type)?.value;
  if (value === undefined) throw new Error(`Missing ${type} from Lima time-zone calculation.`);
  return Number(value);
}

async function deleteExpired(client: pg.PoolClient, table: 'ReportDisplayName' | 'ReportEvent' | 'SubmissionRecord' | 'AbuseRecord'): Promise<number> {
  const result = await client.query(`DELETE FROM "${table}" WHERE "expiresAt" <= CURRENT_TIMESTAMP`);
  return result.rowCount ?? 0;
}

async function deleteAll(client: pg.PoolClient, table: 'ReportDisplayName' | 'ReportEvent' | 'SubmissionRecord' | 'AbuseRecord' | 'OutageEpisode'): Promise<number> {
  const result = await client.query(`DELETE FROM "${table}"`);
  return result.rowCount ?? 0;
}
