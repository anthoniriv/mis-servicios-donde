import { readdir, readFile } from 'node:fs/promises';

import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { RetentionService } from '../src/retention/retention.service.js';

const databaseUrl = process.env.DATABASE_URL ??
  'postgresql://mis_servicios:mis_servicios@127.0.0.1:54329/mis_servicios_test';

describe('retention worker', () => {
  let database: pg.Pool;
  let retention: RetentionService;

  beforeAll(async () => {
    database = new pg.Pool({ connectionString: databaseUrl });
    await database.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
    const migrationsDirectory = new URL('../prisma/migrations/', import.meta.url);
    for (const entry of (await readdir(migrationsDirectory)).sort()) {
      await database.query(await readFile(new URL(`../prisma/migrations/${entry}/migration.sql`, import.meta.url), 'utf8'));
    }
    retention = new RetentionService();
  });

  afterAll(async () => {
    await retention?.onModuleDestroy();
    await database?.end();
  });

  it('erases names after 24 hours and deletes expired event, abuse, idempotency, and alert records', async () => {
    const zone = await database.query<{ id: string }>(`INSERT INTO "PilotZone" ("slug", "name", "approved", "boundary") VALUES ('central', 'Central', true, '{}'::jsonb) RETURNING "id"`);
    const expiredSubmission = await database.query<{ id: string }>(`INSERT INTO "SubmissionRecord" ("deviceToken", "submissionId", "requestHash", "trustDecision", "expiresAt") VALUES ('expired-device', 'expired-submission', 'expired', 'eligible', CURRENT_TIMESTAMP - INTERVAL '30 days') RETURNING "id"`);
    const freshSubmission = await database.query<{ id: string }>(`INSERT INTO "SubmissionRecord" ("deviceToken", "submissionId", "requestHash", "trustDecision", "expiresAt") VALUES ('fresh-device', 'fresh-submission', 'fresh', 'eligible', CURRENT_TIMESTAMP + INTERVAL '30 days') RETURNING "id"`);
    const expiredEvent = await database.query<{ id: string }>(`INSERT INTO "ReportEvent" ("submissionId", "h3Cell", "service", "status", "deviceToken", "expiresAt") VALUES ($1::uuid, '8999999999fffff', 'water', 'outage', 'expired-device', CURRENT_TIMESTAMP - INTERVAL '7 days') RETURNING "id"`, [expiredSubmission.rows[0]?.id]);
    const freshEvent = await database.query<{ id: string }>(`INSERT INTO "ReportEvent" ("submissionId", "h3Cell", "service", "status", "deviceToken", "expiresAt") VALUES ($1::uuid, '8999999999fffff', 'water', 'outage', 'fresh-device', CURRENT_TIMESTAMP + INTERVAL '7 days') RETURNING "id"`, [freshSubmission.rows[0]?.id]);
    await database.query(`INSERT INTO "ReportDisplayName" ("reportEventId", "value", "expiresAt") VALUES ($1::uuid, 'Expired Name', CURRENT_TIMESTAMP - INTERVAL '24 hours'), ($2::uuid, 'Fresh Name', CURRENT_TIMESTAMP + INTERVAL '24 hours')`, [expiredEvent.rows[0]?.id, freshEvent.rows[0]?.id]);
    await database.query(`INSERT INTO "AbuseRecord" ("deviceToken", "decision", "expiresAt") VALUES ('expired-device', 'excluded', CURRENT_TIMESTAMP - INTERVAL '30 days'), ('fresh-device', 'eligible', CURRENT_TIMESTAMP + INTERVAL '30 days')`);
    const episode = await database.query<{ id: string }>(`INSERT INTO "OutageEpisode" ("zoneId", "h3Cell", "service", "expiresAt") VALUES ($1::uuid, '8999999999fffff', 'water', CURRENT_TIMESTAMP + INTERVAL '6 hours') RETURNING "id"`, [zone.rows[0]?.id]);
    await database.query(`INSERT INTO "AlertIntent" ("episodeId", "kind", "content", "createdAt") VALUES ($1::uuid, 'OPENED', 'old safe alert', CURRENT_TIMESTAMP - INTERVAL '30 days')`, [episode.rows[0]?.id]);

    await expect(retention.cleanup()).resolves.toEqual({ displayNames: 1, events: 1, submissions: 1, abuseRecords: 1, alertIntents: 1 });
    await expect(database.query('SELECT "value" FROM "ReportDisplayName" ORDER BY "value"')).resolves.toMatchObject({ rows: [{ value: 'Fresh Name' }] });
    await expect(database.query('SELECT "submissionId" FROM "SubmissionRecord" ORDER BY "submissionId"')).resolves.toMatchObject({ rows: [{ submissionId: 'fresh-submission' }] });
    await expect(database.query('SELECT "deviceToken" FROM "ReportEvent"')).resolves.toMatchObject({ rows: [{ deviceToken: 'fresh-device' }] });
    await expect(database.query('SELECT "deviceToken" FROM "AbuseRecord"')).resolves.toMatchObject({ rows: [{ deviceToken: 'fresh-device' }] });
    await expect(database.query('SELECT count(*) FROM "AlertIntent"')).resolves.toMatchObject({ rows: [{ count: '0' }] });
  });

  it('irreversibly purges pilot data for a rollback while preserving configured zones', async () => {
    await expect(retention.purgePilotData()).resolves.toEqual({ displayNames: 1, events: 1, submissions: 1, abuseRecords: 1, episodes: 1 });
    for (const table of ['ReportDisplayName', 'ReportEvent', 'SubmissionRecord', 'AbuseRecord', 'OutageEpisode', 'AlertIntent']) {
      await expect(database.query(`SELECT count(*) FROM "${table}"`)).resolves.toMatchObject({ rows: [{ count: '0' }] });
    }
    await expect(database.query('SELECT "slug" FROM "PilotZone"')).resolves.toMatchObject({ rows: [{ slug: 'central' }] });
  });
});
