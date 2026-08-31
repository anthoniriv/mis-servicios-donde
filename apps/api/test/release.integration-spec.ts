import { readdir, readFile } from 'node:fs/promises';

/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AlertsService } from '../src/alerts/alerts.service.js';
import { AppModule } from '../src/app.module.js';

const databaseUrl = process.env.DATABASE_URL ??
  'postgresql://mis_servicios:mis_servicios@127.0.0.1:54329/mis_servicios_test';

describe('release outage flow', () => {
  let app: INestApplication;
  let database: pg.Pool;
  let alerts: AlertsService;

  beforeAll(async () => {
    process.env.INTAKE_ENABLED = 'true';
    process.env.PUBLIC_MAP_ENABLED = 'true';
    process.env.ALERT_DISPATCH_ENABLED = 'true';
    database = new pg.Pool({ connectionString: databaseUrl });
    await database.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
    const migrationsDirectory = new URL('../prisma/migrations/', import.meta.url);
    for (const entry of (await readdir(migrationsDirectory)).sort()) {
      await database.query(await readFile(new URL(`../prisma/migrations/${entry}/migration.sql`, import.meta.url), 'utf8'));
    }
    await database.query(`INSERT INTO "PilotZone" ("slug", "name", "approved", "boundary") VALUES
      ('central', 'Central', true, '{"minLatitude": -12.1, "maxLatitude": -12.0, "minLongitude": -77.1, "maxLongitude": -77.0}'),
      ('north', 'North', true, '{"minLatitude": -12.1, "maxLatitude": -12.0, "minLongitude": -77.1, "maxLongitude": -77.0}')`);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    alerts = app.get(AlertsService);
  });

  afterAll(async () => {
    delete process.env.INTAKE_ENABLED;
    delete process.env.PUBLIC_MAP_ENABLED;
    delete process.env.ALERT_DISPATCH_ENABLED;
    await app?.close();
    await database?.end();
  });

  it('creates one safe public cell and one retryable opening intent from concurrent reports', async () => {
    const base = { services: ['water'], status: 'outage', latitude: -12.0464, longitude: -77.0428, name: 'Release Reporter' };
    await Promise.all(['a', 'b', 'c'].map((suffix) => request(app.getHttpServer())
      .post('/v1/reports')
      .send({ ...base, deviceId: `release-device-${suffix}`, submissionId: `release-submission-${suffix}` })
      .expect(201)
      .expect({ submissionId: `release-submission-${suffix}`, accepted: true })));

    const cells = await request(app.getHttpServer()).get('/v1/cells?service=water').expect(200);
    expect(cells.body).toHaveLength(1);
    expect(Object.keys(cells.body[0] ?? {}).sort()).toEqual(['h3Cell', 'service']);
    expect(JSON.stringify(cells.body)).not.toMatch(/device|reporter|latitude|longitude|created/i);

    await Promise.all([alerts.dispatchPending(), alerts.dispatchPending()]);
    const intents = await database.query<{ count: string; status: string; attempts: number; content: string }>(
      'SELECT count(*) OVER (), "status", "attempts", "content" FROM "AlertIntent"',
    );
    expect(intents.rows[0]).toMatchObject({ count: '1', status: 'retryable', attempts: 1 });
    expect(intents.rows[0]?.content).not.toMatch(/release|device|reporter|latitude|longitude/i);
  });

  it('refuses intake and suppresses public cells while rollout gates are disabled', async () => {
    delete process.env.INTAKE_ENABLED;
    await request(app.getHttpServer())
      .post('/v1/reports')
      .send({ services: ['water'], status: 'outage', latitude: -12.0464, longitude: -77.0428, deviceId: 'disabled-device', submissionId: 'disabled-submission' })
      .expect(400)
      .expect({ code: 'report_unavailable', message: 'Unable to process report.' });
    expect((await database.query('SELECT * FROM "SubmissionRecord" WHERE "submissionId" = \'disabled-submission\'' )).rowCount).toBe(0);

    delete process.env.PUBLIC_MAP_ENABLED;
    await request(app.getHttpServer()).get('/v1/cells?service=water').expect(200).expect([]);

    delete process.env.ALERT_DISPATCH_ENABLED;
    await alerts.dispatchPending();
    await expect(database.query('SELECT "status" FROM "AlertIntent"')).resolves.toMatchObject({ rows: [{ status: 'cancelled' }] });
  });
});
