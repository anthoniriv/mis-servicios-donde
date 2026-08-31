import { readdir, readFile } from 'node:fs/promises';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';

const databaseUrl = process.env.DATABASE_URL ??
  'postgresql://mis_servicios:mis_servicios@127.0.0.1:54329/mis_servicios_test';

/* eslint-disable @typescript-eslint/no-unsafe-argument */

describe('executable API foundation', () => {
  let app: INestApplication;
  let database: pg.Pool;

  beforeAll(async () => {
    database = new pg.Pool({ connectionString: databaseUrl });
    await database.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
    const migrationsDirectory = new URL('../prisma/migrations/', import.meta.url);
    for (const entry of (await readdir(migrationsDirectory)).sort()) {
      const migration = await readFile(new URL(`../prisma/migrations/${entry}/migration.sql`, import.meta.url), 'utf8');
      await database.query(migration);
    }
    await database.query('CREATE TABLE IF NOT EXISTS fixture_probe (id integer PRIMARY KEY)');
    await database.query('TRUNCATE fixture_probe');

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await database?.end();
  });

  it('serves health through Supertest', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.text).toBe('{"status":"ok"}');
  });

  it('applies the coordinate-free privacy migration to PostgreSQL', async () => {
    const result = await database.query<{ column_name: string }>(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'ReportEvent'",
    );
    expect(result.rows.map((row) => row.column_name)).toContain('h3Cell');
    expect(result.rows.map((row) => row.column_name)).not.toContain('latitude');
  });

  describe('report intake', () => {
  const report = {
    submissionId: 'submission-001',
    deviceId: 'device-001',
    services: ['water', 'electricity', 'internet'],
    status: 'outage',
    latitude: -12.0464,
    longitude: -77.0428,
    name: 'Ana',
  };

  beforeAll(async () => {
    await database.query(
      `INSERT INTO "PilotZone" ("slug", "name", "approved", "boundary") VALUES ('central', 'Central', true, '{"minLatitude": -12.1, "maxLatitude": -12.0, "minLongitude": -77.1, "maxLongitude": -77.0}')`,
    );
  });

  it('rejects reports outside enabled pilot boundaries without creating report events', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/reports')
      .send({ ...report, submissionId: 'outside-001', latitude: -13, longitude: -77 })
      .expect(400);

    expect(response.body).toEqual({ code: 'report_unavailable', message: 'Unable to process report.' });
    expect((await database.query('SELECT * FROM "ReportEvent"')).rowCount).toBe(0);
  });

  it('expands a valid submission atomically across selected services and keeps raw coordinates out of storage', async () => {
    const response = await request(app.getHttpServer()).post('/v1/reports').send(report).expect(201);
    expect(response.body).toEqual({ submissionId: report.submissionId, accepted: true });

    const events = await database.query<{ service: string; "h3Cell": string; "deviceToken": string }>(
      'SELECT "service", "h3Cell", "deviceToken" FROM "ReportEvent" ORDER BY "service"',
    );
    expect(events.rows.map((event) => event.service)).toEqual(['water', 'electricity', 'internet']);
    expect(new Set(events.rows.map((event) => event.h3Cell)).size).toBe(1);
    expect(JSON.stringify(events.rows)).not.toContain(String(report.latitude));
    expect(JSON.stringify(events.rows)).not.toContain(report.deviceId);
    await expect(database.query(`UPDATE "ReportEvent" SET "status" = 'restored' WHERE "submissionId" = (SELECT "id" FROM "SubmissionRecord" WHERE "submissionId" = $1)`, [report.submissionId])).rejects.toThrow();
  });

  it('returns the original outcome for an identical retry and rejects a conflicting retry without adding events', async () => {
    const retry = await request(app.getHttpServer()).post('/v1/reports').send(report).expect(201);
    expect(retry.body).toEqual({ submissionId: report.submissionId, accepted: true });

    await request(app.getHttpServer())
      .post('/v1/reports')
      .send({ ...report, services: ['water'], status: 'restored' })
      .expect(409)
      .expect({ code: 'submission_conflict', message: 'Submission identifier conflicts with prior input.' });

    expect((await database.query('SELECT * FROM "ReportEvent"')).rowCount).toBe(3);
  });

  it('rolls back every event when the service expansion cannot complete', async () => {
    await database.query(`
      CREATE OR REPLACE FUNCTION fail_internet_event() RETURNS trigger AS $$
      BEGIN
        IF NEW."service" = 'internet' THEN RAISE EXCEPTION 'forced event failure'; END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      CREATE TRIGGER fail_internet_event BEFORE INSERT ON "ReportEvent"
      FOR EACH ROW EXECUTE FUNCTION fail_internet_event();
    `);

    await request(app.getHttpServer())
      .post('/v1/reports')
      .send({ ...report, submissionId: 'atomic-001', services: ['water', 'internet'] })
      .expect(500)
      .expect({ code: 'report_unavailable', message: 'Unable to process report.' });

    expect((await database.query('SELECT * FROM "SubmissionRecord" WHERE "submissionId" = $1', ['atomic-001'])).rowCount).toBe(0);
    expect((await database.query('SELECT * FROM "ReportEvent"')).rowCount).toBe(3);
  });
});

});
